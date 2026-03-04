import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Poll, Message } from './server/models.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production';

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.warn('MONGODB_URI not provided. Running without database connection.');
  }

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = await User.findById(req.user.userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  };

  // API Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: 'participant', // Default role
      });

      await user.save();

      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, raisedHand: user.raisedHand } });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
    try {
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/polls', authenticateToken, async (req, res) => {
    try {
      const polls = await Poll.find().sort({ createdAt: -1 });
      res.json(polls);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
      const messages = await Message.find().populate('sender', 'name role').sort({ createdAt: -1 }).limit(50);
      res.json(messages.reverse());
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error'));
      socket.data.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.userId}`);
    
    socket.broadcast.emit('user-joined', { userId: socket.data.user.userId });

    socket.on('send-message', async (content) => {
      try {
        const message = new Message({
          sender: socket.data.user.userId,
          content
        });
        await message.save();
        const populatedMessage = await message.populate('sender', 'name role');
        io.emit('receive-message', populatedMessage);
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('raise-hand', async (raised: boolean) => {
      try {
        await User.findByIdAndUpdate(socket.data.user.userId, { raisedHand: raised });
        io.emit('hand-status-changed', { userId: socket.data.user.userId, raised });
      } catch (err) {
        console.error('Error updating hand status:', err);
      }
    });

    socket.on('clear-all-hands', async () => {
      try {
        const user = await User.findById(socket.data.user.userId);
        if (user?.role === 'admin') {
          await User.updateMany({}, { raisedHand: false });
          io.emit('all-hands-cleared');
        }
      } catch (err) {
        console.error('Error clearing hands:', err);
      }
    });

    socket.on('create-poll', async (pollData) => {
      try {
        const user = await User.findById(socket.data.user.userId);
        if (user?.role === 'admin') {
          const poll = new Poll({
            question: pollData.question,
            options: pollData.options,
            responses: []
          });
          await poll.save();
          io.emit('new-poll', poll);
        }
      } catch (err) {
        console.error('Error creating poll:', err);
      }
    });

    socket.on('submit-poll-response', async ({ pollId, optionIndex }) => {
      try {
        const poll = await Poll.findById(pollId);
        if (poll) {
          // Check if user already responded
          const existingResponse = poll.responses.find(r => r.userId?.toString() === socket.data.user.userId);
          if (existingResponse) {
            existingResponse.selectedOption = optionIndex;
          } else {
            poll.responses.push({ userId: socket.data.user.userId, selectedOption: optionIndex });
          }
          await poll.save();
          io.emit('poll-updated', poll);
        }
      } catch (err) {
        console.error('Error submitting poll response:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.userId}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
