# 📱 ABA Chat: High-Performance Real-Time Messaging

ABA Chat is a professional-grade, cross-platform messaging application built with **React Native (Expo)**, **Node.js**, and **WebRTC**. It delivers a seamless, high-fidelity communication experience with real-time text, voice, and video capabilities.

![App Showcase](https://img.shields.io/badge/Status-Advanced_Prototype-blue?style=for-the-badge)
![React Native](https://img.shields.io/badge/React_Native-0.74+-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_51-000020?style=for-the-badge&logo=expo)
![NodeJS](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs)

---

## ✨ Core Features

### 💬 Intelligent Messaging
- **Real-time Delivery**: Lightning-fast message delivery powered by Socket.io.
- **Rich Media**: Support for images, documents, and voice notes.
- **Typing Indicators**: Real-time awareness of conversational activity.
- **Read Receipts**: Track message status (Sent, Delivered, Read).
- **Offline Persistence**: Full message history available offline via local SQLite database.

### 📞 Advanced Calling (WebRTC)
- **Voice & Video**: High-quality peer-to-peer calls using WebRTC (native & web support).
- **Cross-Platform**: Seamless calling between iOS, Android, and Web browsers.
- **Call Management**: Detailed call logs (Incoming, Outgoing, Canceled, Missed) with duration tracking.
- **Privacy Controls**: Real-time audio/video toggle (mute/camera-off).

### 🔔 Smart Notifications
- **Push Alerts**: Instant system notifications for incoming calls and messages (powered by Expo Notifications).
- **Background Support**: Reliable alerts even when the application is closed.

### 🎨 Premium User Experience
- **Telegram-style Profiles**: Stunning profile previews with rectangular imagery and Gaussian blur effects.
- **Adaptive Theming**: Fully integrated Dark and Light modes.
- **Multilingual**: Intelligent Amharic and English localization.
- **Smooth Animations**: High-performance micro-interactions using React Native Reanimated.

---

## 🛠️ Technical Architecture

### Frontend (Expo Ecosystem)
- **Navigation**: Type-safe file-based routing with `expo-router`.
- **Media Engine**: `expo-av` for audio recording/playback and `expo-image-picker` for media selection.
- **Real-time**: `socket.io-client` for persistent signaling and messaging.
- **WebRTC**: `react-native-webrtc` for native peer connections and standard browser APIs for web.

### Backend (Node.js Infrastructure)
- **Engine**: Express.js server optimized for low-latency signaling.
- **Real-time**: Socket.io server managing user presence and signaling.
- **Storage**: `better-sqlite3` for high-performance relational data persistence.
- **Push Engine**: `expo-server-sdk` for managing cross-platform push delivery.

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js (>= 20.0.0)
- Expo Go (for development) or EAS Build (for production)

### 2. Backend Deployment
```bash
cd backend
npm install
node index.js
```

### 3. Mobile/Web Client
```bash
cd frontend
npm install
npx expo start
```

---

## 📜 Network & WebRTC Notes

> [!IMPORTANT]
> **Why do calls sometimes fail?**
> In real-world network environments, users are often behind firewalls or NAT (Network Address Translation). While ABA Chat uses Google's public STUN servers to navigate NAT, some "Symmetric NAT" environments require a **TURN (Traversal Using Relays around NAT)** server to relay traffic. 
> 
> **Current Status**: STUN only. If you encounter a "Connection Failed" state, it is likely due to restrictive network conditions which would require a TURN server for relay.

---

## 🤝 Roadmap & Contribution

ABA Chat is continuously evolving. Planned features include:
- [ ] End-to-End Encryption (E2EE)
- [ ] Group Video Conferencing
- [ ] Story Integration (Status Updates)
- [ ] Global CDN for Media Storage

Developed with ❤️ by Astawus Amsalu.
