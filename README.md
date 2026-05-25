<div align="center">

<br/>

```
███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗ ██████╗  ██████╗ 
██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔════╝ ██╔═══██╗
███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║██║  ███╗██║   ██║
╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║██║   ██║██║   ██║
███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝╚██████╔╝
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝  ╚═════╝ 
```

### 🎬 The Ultimate Real-Time Social Watch Party Platform

*Watch together. Feel together. Never watch alone again.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io_4-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<br/>

![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)

</div>

---

## 📖 Table of Contents

- [What is StreamGo?](#-what-is-streamgo)
- [Feature Showcase](#-feature-showcase)
- [Architecture Deep Dive](#-architecture-deep-dive)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Mobile vs Desktop](#-mobile-vs-desktop-experience)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 What is StreamGo?

**StreamGo** is a full-stack, real-time social watch party platform built for the modern web. It lets you and your friends gather in virtual cinematic rooms to watch movies or any video content — **perfectly synchronized, millisecond-accurate**, with voice chat and live reactions — all from your browser.

> Think Netflix Party — but turbocharged with peer-to-peer voice, screen sharing, floating emoji reactions, cinematic ambilight effects, room queues, friend invites, PIN-locked rooms, and host controls.

Whether you're hosting a movie night with friends across the world or building an interactive viewing experience, StreamGo brings the cinema to your browser with zero compromise on quality or latency.

---

## ✨ Feature Showcase

### 🔄 Flawless Millisecond Video Sync
Every play, pause, and seek event is broadcast to all room participants in real time via Socket.io. The server reconciles buffering states — if any participant is buffering, playback pauses for everyone and resumes only when all clients are ready. No more "wait, I'm 10 seconds behind!"

### 🎙️ WebRTC Peer-to-Peer Voice Chat
Real voice conversations powered by WebRTC — not a server-relay, but direct peer-to-peer audio streams for the lowest possible latency. Features include:
- 🎤 Active-speaker visual detection (glowing ring on the active speaker's avatar)
- 🔇 One-click microphone mute/unmute
- 🔊 Echo cancellation and auto-gain control for crystal-clear audio
- 📱 Optimized for both mobile and desktop browsers

### 💻 Screen Sharing
Instantly switch from a movie to sharing your own screen or a browser tab with a single click. Powered by the WebRTC `getDisplayMedia` API — no plugins required.

### 💬 Floating Danmaku Chat
Live chat messages don't pile up in a boring sidebar — they float dynamically across the video like danmaku (弾幕), used in Japanese streaming culture. Emoji reactions fly across the screen, creating a shared, immersive atmosphere without cluttering the viewing area.

### 🌈 Cinematic Ambilight Effect *(Desktop Only)*
A GPU-accelerated glow effect that samples the average colors from the currently playing video and projects them as a soft light bloom onto the background — simulating a Philips Ambilight TV experience. Completely automatic, dynamic, and cinematic.

### 🏠 Smart Room Management
- Create public or private rooms with custom names
- Lock rooms with PIN codes — only those with the password can join
- Host can kick participants from the room
- Real-time participant list with avatars and speaking indicators
- Browse active public rooms from the lobby

### 📋 Video Queue / Playlist
Hosts can queue up multiple videos for back-to-back playback. The queue is shared in real time with all room participants via the sidebar's Queue tab.

### 👥 Friends System
- Send and accept friend requests
- Receive in-app notifications for friend requests and room invites
- Invite friends directly from the room via the Invite modal
- Friend management via the dedicated Friends page

### ☁️ Cloudflare R2 / S3 Video Upload
Upload large video files directly from your browser to Cloudflare R2 object storage using pre-signed S3-compatible URLs. No server memory bottleneck — uploads go straight from client to cloud.

### 🔒 Secure Authentication
Full user authentication powered by **NextAuth.js** with credentials-based login, bcrypt-hashed passwords, and session management. Protected routes automatically redirect unauthenticated users to login.

### 📱 Fully Responsive — Mobile-First
The UI adapts intelligently between mobile and desktop:
- **Mobile**: Tabbed navigation hides non-essential controls, maximizing video real estate
- **Desktop**: Persistent sidebars, ambilight, keyboard hotkeys, and full host controls

---

## 🏗️ Architecture Deep Dive

StreamGo uses a **hybrid architecture** combining a centralized signaling server with a peer-to-peer data mesh for maximum performance:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   Next.js    │    │  Socket.io   │    │  WebRTC Peer     │  │
│  │   Frontend   │◄──►│   Client     │    │  Connection      │  │
│  │  (React 19)  │    │              │    │  (Audio/Video)   │  │
│  └──────────────┘    └──────┬───────┘    └────────┬─────────┘  │
└─────────────────────────────┼──────────────────────┼───────────┘
                              │                      │
                    Signaling │                      │ P2P Media
                    (Rooms,   │                      │ (Post-handshake)
                    Chat,     │                      │
                    Sync)     │                      │
                              ▼                      │
┌─────────────────────────────────────────────────────────────────┐
│                     NODE.JS SERVER (server.js)                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Socket.io Server                       │   │
│  │                                                          │   │
│  │  • Room state management (Map<roomId, roomData>)         │   │
│  │  • Video sync events (play/pause/seek/buffer)            │   │
│  │  • WebRTC signaling (offer/answer/ICE candidates)        │   │
│  │  • Chat message routing                                  │   │
│  │  • Friend invite system (userId → socketId mapping)      │   │
│  │  • Host controls (kick, lock, password)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────┐          ┌───────────────────────────┐   │
│  │   Next.js API     │          │     Prisma ORM            │   │
│  │   Routes          │◄────────►│   (PostgreSQL/Supabase)   │   │
│  │  /api/auth        │          │                           │   │
│  │  /api/friends     │          │  Users, Rooms, Videos,    │   │
│  │  /api/upload      │          │  Friendships,             │   │
│  │  /api/video       │          │  Notifications            │   │
│  │  /api/profile     │          │                           │   │
│  └───────────────────┘          └───────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                   P2P Audio/Video bypasses
                   server entirely after handshake
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    CLOUDFLARE R2 / S3                           │
│              (Direct pre-signed URL uploads)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Concern | Solution | Why |
|---|---|---|
| Video Sync | Socket.io events + buffering consensus | Guarantees all clients stay in lock-step |
| Voice Chat | WebRTC P2P | Zero server bandwidth for audio; ultra-low latency |
| Signaling | Custom Socket.io server embedded in Next.js | Single process, no separate deploy needed |
| Auth | NextAuth.js + Prisma | Battle-tested, credentials + session ready |
| Storage | Cloudflare R2 via AWS SDK v3 | S3-compatible, cheap egress, pre-signed uploads |
| DB | PostgreSQL via Prisma | Type-safe ORM, easy migrations, Supabase/Neon ready |

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js | 16.2.6 |
| **UI Library** | React | 19.2.4 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Real-time** | Socket.io | 4.8.3 |
| **P2P Media** | WebRTC (browser native) | — |
| **ORM** | Prisma | 6.x |
| **Database** | PostgreSQL | — |
| **Auth** | NextAuth.js | 4.x |
| **Password Hashing** | bcryptjs | 3.x |
| **Cloud Storage** | AWS SDK v3 (Cloudflare R2) | 3.x |
| **File Upload** | Multer | 2.x |
| **DB Client** | Supabase JS / pg | 2.x / 8.x |

---

## 🗄 Database Schema

StreamGo uses a relational PostgreSQL database managed through Prisma. Here's the full data model:

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String         // bcrypt hashed
  name          String?
  avatar        String?
  rooms         Room[]         @relation("RoomHost")
  sentFriends   Friendship[]   @relation("UserSent")
  recFriends    Friendship[]   @relation("UserReceived")
  notifications Notification[]
  createdAt     DateTime       @default(now())
}

model Room {
  id        String   @id @default(cuid())
  name      String
  hostId    String
  host      User     @relation("RoomHost", fields: [hostId], references: [id])
  videoId   String?
  video     Video?   @relation(fields: [videoId], references: [id])
  isPrivate Boolean  @default(false)
  isLocked  Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Video {
  id         String   @id @default(cuid())
  title      String
  url        String   // Cloudflare R2 or local path
  uploaderId String
  rooms      Room[]
  createdAt  DateTime @default(now())
}

model Friendship {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  status     String   @default("PENDING")  // PENDING | ACCEPTED
  sender     User     @relation("UserSent",      fields: [senderId],   references: [id])
  receiver   User     @relation("UserReceived",  fields: [receiverId], references: [id])
  createdAt  DateTime @default(now())
  @@unique([senderId, receiverId])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // FRIEND_REQUEST | ROOM_INVITE
  content   String
  roomId    String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher → [Download](https://nodejs.org/)
- **npm** v9+ (comes with Node.js)
- A **PostgreSQL** database — use [Supabase](https://supabase.com/) (free tier) or [Neon](https://neon.tech/) (free tier)

---

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/movie-streaming.git
cd movie-streaming
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project:

```env
# ─── DATABASE ────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# ─── NEXTAUTH ────────────────────────────────────────────────────────────
NEXTAUTH_SECRET="your-super-secret-key-at-least-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# ─── SOCKET SERVER ───────────────────────────────────────────────────────
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"

# ─── CLOUDFLARE R2 (Optional) ────────────────────────────────────────────
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_BUCKET_NAME="your_r2_bucket_name"
```

> 💡 **Tip**: Use `openssl rand -base64 32` to generate a strong `NEXTAUTH_SECRET`.

### 4. Push the Database Schema

```bash
npx prisma db push
```

This creates all tables in your PostgreSQL database using the Prisma schema.

### 5. (Optional) Open Prisma Studio

```bash
npx prisma studio
```

A browser-based GUI to inspect and manage your database records.

### 6. Start the Development Server

```bash
npm run dev
```

This boots both the **Next.js frontend** and the **Socket.io signaling server** concurrently via a single `node server.js` process.

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | ✅ Yes | PostgreSQL direct connection string (for migrations) |
| `NEXTAUTH_SECRET` | ✅ Yes | Secret for signing JWT tokens (min 32 chars) |
| `NEXTAUTH_URL` | ✅ Yes | Canonical URL of your app |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ Yes | URL where the Socket.io server is reachable |
| `R2_ACCESS_KEY_ID` | ⚡ Optional | Cloudflare R2 access key (for video uploads) |
| `R2_SECRET_ACCESS_KEY` | ⚡ Optional | Cloudflare R2 secret key |
| `R2_ACCOUNT_ID` | ⚡ Optional | Cloudflare account ID |
| `R2_BUCKET_NAME` | ⚡ Optional | Name of your R2 bucket |

---

## 📁 Project Structure

```
movie-streaming/
├── 📄 server.js                    # Entry point: Next.js + Socket.io combined server
├── 📄 socket-server.js             # Standalone Socket.io server (for separate deploy)
├── 📄 package.json
├── 📄 next.config.ts
├── 📄 tsconfig.json
│
├── 📂 prisma/
│   ├── schema.prisma               # Full database schema
│   └── migrations/                 # Auto-generated SQL migrations
│
├── 📂 public/                      # Static assets
│
└── 📂 src/
    ├── 📂 app/                     # Next.js App Router pages
    │   ├── 📄 page.tsx             # Landing page / Lobby (browse rooms)
    │   ├── 📄 layout.tsx           # Root layout with session provider
    │   ├── 📄 globals.css          # Global styles + Tailwind imports
    │   │
    │   ├── 📂 login/page.tsx       # Sign-in page
    │   ├── 📂 register/page.tsx    # User registration page
    │   ├── 📂 profile/page.tsx     # User profile & avatar settings
    │   ├── 📂 friends/page.tsx     # Friends list, requests, notifications
    │   │
    │   ├── 📂 room/[id]/page.tsx   # ⭐ Core watch party room (42KB of magic)
    │   │
    │   └── 📂 api/
    │       ├── auth/[...nextauth]/ # NextAuth.js handler
    │       ├── auth/register/      # POST: register new user
    │       ├── friends/            # GET/POST: manage friendships
    │       ├── profile/            # GET/PATCH: update profile
    │       ├── upload/             # POST: generate R2 pre-signed URL
    │       └── video/              # GET: fetch video metadata
    │
    ├── 📂 components/
    │   ├── GlobalListeners.tsx     # Global Socket.io event listeners (invites)
    │   └── Providers.tsx           # NextAuth SessionProvider wrapper
    │
    ├── 📂 hooks/
    │   └── useWebRTC.ts            # ⭐ Custom hook: WebRTC voice + screen share
    │
    ├── 📂 lib/
    │   ├── auth.ts                 # NextAuth config (credentials provider)
    │   └── prisma.ts               # Prisma client singleton
    │
    └── 📂 types/
        └── next-auth.d.ts          # Augmented session types
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user `{ email, password, name }` |
| `POST` | `/api/auth/[...nextauth]` | Sign in / Sign out (NextAuth) |
| `GET` | `/api/auth/[...nextauth]` | Get current session |

### Friends & Notifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/friends` | List friends, pending requests, notifications |
| `POST` | `/api/friends` | Send friend request / accept / decline |

### Videos & Upload

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Get a pre-signed R2 URL for direct client upload |
| `GET` | `/api/video` | Fetch video metadata by ID |

### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get current user profile |
| `PATCH` | `/api/profile` | Update name or avatar URL |

### Real-time Socket Events (Socket.io)

| Event (Client → Server) | Payload | Description |
|---|---|---|
| `join-room` | `{ roomId, password, userName }` | Join a watch room |
| `video-play` | `{ roomId, time }` | Broadcast play event |
| `video-pause` | `{ roomId, time }` | Broadcast pause event |
| `video-seek` | `{ roomId, time }` | Broadcast seek event |
| `video-buffering` | `{ roomId }` | Signal buffering state |
| `video-buffering-done` | `{ roomId }` | Signal buffer complete |
| `chat-message` | `{ roomId, message, userName }` | Send chat message |
| `send-reaction` | `{ roomId, emoji, userName }` | Send floating emoji |
| `send-invite` | `{ targetUserId, roomId, fromUser }` | Invite a friend |
| `webrtc-offer` | `{ to, offer }` | WebRTC handshake offer |
| `webrtc-answer` | `{ to, answer }` | WebRTC handshake answer |
| `webrtc-ice-candidate` | `{ to, candidate }` | ICE candidate exchange |
| `lock-room` | `{ roomId, password }` | Host: lock room with PIN |
| `kick-user` | `{ roomId, userName }` | Host: kick a participant |

---

## 📱 Mobile vs Desktop Experience

StreamGo ships with a **fully adaptive, mobile-first UI**:

### 📱 Mobile
- Tabbed interface (Video / Chat / Participants) — maximizes video space
- Touch-optimized controls
- Condensed participant list
- Voice chat and floating reactions remain fully active
- Screen sharing supported on supported mobile browsers

### 🖥️ Desktop
- Persistent sidebar with Chat, Queue, and Participants tabs
- Toggle sidebar with `C` key
- **Ambilight glow effect** from video colors (canvas-based, GPU accelerated)
- Full keyboard control
- Expanded host controls panel

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause video |
| `←` Arrow | Seek backward 10 seconds |
| `→` Arrow | Seek forward 10 seconds |
| `F` | Toggle fullscreen |
| `C` | Toggle sidebar |

---

## 🚢 Deployment

### Option 1 — Vercel + Render (Recommended)

StreamGo consists of two server-side components that need to be deployed:

**1. Next.js Frontend → Vercel**

```bash
# Push to GitHub, then import the repo on vercel.com
# Set all environment variables in the Vercel dashboard
```

> ⚠️ **Important**: Vercel does not support persistent WebSockets. Deploy the Socket.io server separately.

**2. Socket.io Signaling Server → Render**

The `socket-server.js` file is a standalone Node.js server designed to be deployed independently (e.g., on [Render.com](https://render.com) free tier).

```bash
# On Render: set Start Command to: node socket-server.js
# Set the PORT environment variable
# Copy your deployed URL to NEXT_PUBLIC_SOCKET_URL in Vercel
```

**3. Database → Supabase or Neon**

Create a free PostgreSQL instance and copy the connection strings to your environment variables.

---

### Option 2 — Single Server (VPS / Railway)

If deploying to a VPS, Railway, or any platform supporting persistent processes, run the unified `server.js`:

```bash
npm run build
npm start
# NODE_ENV=production node server.js
```

This boots Next.js and Socket.io in a single process on one port.

---

### Docker (DIY)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🤝 Contributing

Contributions are what make the open-source community such a great place. Any contributions you make are **greatly appreciated**!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

Please make sure to:
- Follow the existing TypeScript code style
- Run `npm run lint` before submitting
- Update relevant documentation if needed

### 🐛 Found a Bug?

Open an issue at the [issues page](https://github.com/yourusername/movie-streaming/issues) with a clear description, steps to reproduce, and expected vs. actual behavior.

---

## 🗺️ Roadmap

- [ ] 🎬 HLS / DASH adaptive streaming support
- [ ] 📺 YouTube / Twitch URL playback integration
- [ ] 🌍 TURN server configuration for NAT traversal (production WebRTC)
- [ ] 🖼️ Custom room banners and themes
- [ ] 📊 Room analytics dashboard for hosts
- [ ] 🔔 Push notifications for friend invites
- [ ] 🎭 Watch party event scheduling

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.

---

<div align="center">

Built with ❤️ by developers who hate watching movies alone.

*If StreamGo saved your movie night, give it a ⭐ — it means the world!*

</div>
