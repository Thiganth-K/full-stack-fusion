# Cinematic Workshop Setup Instructions

This is a full-stack MERN application built with React, Express, MongoDB, and Socket.io.

## Prerequisites

1.  **MongoDB URI**: You need a MongoDB connection string.
    *   Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    *   Get your connection string and replace `<username>` and `<password>` with your database user credentials.
2.  **Environment Variables**:
    *   Open `.env.example` (or create a `.env` file if running locally outside AI Studio).
    *   Set `MONGODB_URI` to your connection string.
    *   Set `JWT_SECRET` to a secure random string.

## Running the Application

In the AI Studio environment, the application will automatically start using the `npm run dev` script, which executes `tsx server.ts`.

## Admin Access

By default, all new users sign up as a `participant`.
To grant a user `admin` access:

1.  Sign up a user through the application UI.
2.  Connect to your MongoDB database (e.g., using MongoDB Compass or Atlas UI).
3.  Find the `users` collection.
4.  Locate the user document you want to make an admin.
5.  Change the `role` field from `"participant"` to `"admin"`.
6.  Refresh the application or log in again with that user. They will now see the "Admin Panel" in the sidebar.

## Features

*   **Real-time Chat**: Global chat room for all participants.
*   **Raise Hand**: Participants can raise their hand to get the admin's attention. Admins can clear all hands.
*   **Live Polls**: Admins can create polls and push them to all participants in real-time. Results update live as participants vote.
*   **Cinematic Theme**: A sleek, dark, minimalist UI inspired by cinematic aesthetics.
