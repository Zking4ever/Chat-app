# Project-App: Real-time Messaging & Chat Application

A high-performance, real-time messaging application built with React Native (Expo) and a Node.js backend. This project features instant messaging, contact synchronization, and a smooth WhatsApp-inspired UI.

## 🚀 Key Features

- **Real-time Messaging**: Powered by Socket.io for instant delivery.
- **WhatsApp-like UI**: Clean, intuitive interface built with React Native.
- **Contact Detection**: Automatic synchronization and detection of contacts.
- **Secure Authentication**: Backend-verified user sessions and phone-number-based login flows.
- **Local Persistence**: Offline support and message history stored using SQLite.

## 📁 Project Structure

### Frontend (`/frontend`)
- **Framework**: Expo (React Native) with File-based Routing.
- **State Management**: React Context API (`AuthContext`) for authentication.
- **Navigation**: Expo Router handling protected routes and layout segments.
- **Styling**: Vanilla CSS/StyleSheet for a premium, custom feel.

### Backend (`/backend`)
- **Server**: Node.js with Express.
- **Real-time**: Socket.io for bi-directional communication.
- **Database**: SQLite (`messaging.db`) for efficient data storage.
- **Authentication**: Firebase Admin SDK integration (prepared for phone auth).

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (>= 20.0.0)
- npm or yarn

### 2. Setup Backend
```bash
cd backend
npm install
node index.js
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npx expo start
```

## 📜 Development Notes

- **API Layer**: Centralized in `frontend/lib/api.ts`.
- **Types**: Shared interfaces defined in `frontend/constants/types.ts`.
- **Layouts**: Protected routing logic is implemented in `frontend/app/_layout.tsx`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

