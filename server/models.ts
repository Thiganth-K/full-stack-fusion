import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['participant', 'admin'], default: 'participant' },
  raisedHand: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const pollSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  responses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    selectedOption: { type: Number, required: true }
  }],
}, { timestamps: true });

export const Poll = mongoose.model('Poll', pollSchema);

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
