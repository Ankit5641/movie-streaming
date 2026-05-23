const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Intercept active rooms API for Phase 3
      if (parsedUrl.pathname === '/api/active-rooms' && req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        
        const publicRooms = [];
        for (const [roomId, data] of roomsData.entries()) {
          if (!data.locked) {
            const clients = io.sockets.adapter.rooms.get(roomId);
            if (clients && clients.size > 0) {
              publicRooms.push({
                id: roomId,
                users: clients.size,
                hasVideo: data.hasVideo || false
              });
            }
          }
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({ rooms: publicRooms }));
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Attach Socket.io
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const roomsData = new Map();
  const globalUsers = new Map(); // userId -> socket.id

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("register-user", ({ userId }) => {
      globalUsers.set(userId, socket.id);
    });

    socket.on("send-invite", ({ targetUserId, roomId, fromUser }) => {
      const targetSocketId = globalUsers.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("receive-invite", { roomId, fromUser });
      }
    });

    socket.on("join-room", ({ roomId, password, userName }) => {
      const room = roomsData.get(roomId);
      if (room && room.password && room.password !== password) {
        socket.emit("join-error", "Invalid password");
        return;
      }
      
      socket.join(roomId);
      console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);
      socket.emit("join-success", roomId);
      // Notify others in room
      socket.to(roomId).emit("user-connected", { id: socket.id, name: userName });
    });

    socket.on("disconnecting", () => {
      // Notify rooms before leaving them
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("user-disconnected", socket.id);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const [userId, sId] of globalUsers.entries()) {
        if (sId === socket.id) {
          globalUsers.delete(userId);
          break;
        }
      }
    });

    // Phase 4: Video Sync Events
    socket.on("play", ({ roomId, time }) => {
      socket.to(roomId).emit("play", { time });
    });

    socket.on("pause", ({ roomId, time }) => {
      socket.to(roomId).emit("pause", { time });
    });

    socket.on("seek", ({ roomId, time }) => {
      socket.to(roomId).emit("seek", { time });
    });

    socket.on("sync-time", ({ roomId, time }) => {
      socket.to(roomId).emit("sync-time", { time });
    });

    socket.on("sync-video", ({ roomId, url }) => {
      if (!roomsData.has(roomId)) {
        roomsData.set(roomId, { locked: false });
      }
      const room = roomsData.get(roomId);
      room.hasVideo = !!url;
      roomsData.set(roomId, room);
      socket.to(roomId).emit("sync-video", { url });
    });

    socket.on("sync-playlist", ({ roomId, playlist }) => {
      if (!roomsData.has(roomId)) {
        roomsData.set(roomId, { locked: false, playlist: [] });
      }
      const room = roomsData.get(roomId);
      room.playlist = playlist;
      roomsData.set(roomId, room);
      socket.to(roomId).emit("sync-playlist", { playlist });
    });

    // Phase 5: Admin Controls
    socket.on("lock-room", ({ roomId, locked }) => {
      socket.to(roomId).emit("lock-room", { locked });
    });

    socket.on("set-room-password", ({ roomId, password }) => {
      if (!roomsData.has(roomId)) {
        roomsData.set(roomId, { password });
      } else {
        roomsData.get(roomId).password = password;
      }
      socket.emit("password-set", true);
    });

    socket.on("video-buffering", ({ roomId, userName }) => {
      socket.to(roomId).emit("video-buffering", { id: socket.id, name: userName });
    });

    socket.on("video-ready", ({ roomId }) => {
      socket.to(roomId).emit("video-ready", { id: socket.id });
    });

    socket.on("start-screen-share", ({ roomId }) => {
      socket.to(roomId).emit("start-screen-share", { id: socket.id });
    });

    socket.on("stop-screen-share", ({ roomId }) => {
      socket.to(roomId).emit("stop-screen-share", { id: socket.id });
    });

    // Phase 3: Text Chat & Reactions
    socket.on("send-message", ({ roomId, message, user, avatar }) => {
      io.to(roomId).emit("receive-message", { message, user, avatar, id: Date.now() });
    });
    
    socket.on("send-reaction", ({ roomId, emoji, user }) => {
      io.to(roomId).emit("receive-reaction", { emoji, user, id: Date.now() });
    });
    
    // WebRTC Live Voice Chat Signaling
    socket.on("webrtc-offer", ({ target, caller, sdp }) => {
      io.to(target).emit("webrtc-offer", { caller, sdp });
    });

    socket.on("webrtc-answer", ({ target, caller, sdp }) => {
      io.to(target).emit("webrtc-answer", { caller, sdp });
    });

    socket.on("webrtc-ice-candidate", ({ target, candidate, sender }) => {
      io.to(target).emit("webrtc-ice-candidate", { candidate, sender });
    });
  });

  // Clean up inactive rooms every hour
  setInterval(() => {
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    for (const [roomId, data] of roomsData.entries()) {
      const clients = io.sockets.adapter.rooms.get(roomId);
      if (clients && clients.size > 0) {
        data.lastActivity = now; // Room is active
      } else {
        if (!data.lastActivity) data.lastActivity = now;
        if (now - data.lastActivity > SIX_HOURS) {
          roomsData.delete(roomId);
          console.log(`Deleted inactive room: ${roomId}`);
        }
      }
    }
  }, 60 * 60 * 1000);

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
