// socket/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import Message from "../models/message/Message.js";
import Conversation from "../models/message/Conversation.js";
import { JWT_SECRET } from "../config/config.js";

let io;

// In-memory online users map
// userId => array of socket IDs
const onlineUsers = new Map();

// Helper: verify JWT from cookie
const getUserIdFromCookie = (socket) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return null;

    const parsed = cookie.parse(cookies);
    const token = parsed.token;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (err) {
    return null;
  }
};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Socket auth middleware
  io.use((socket, next) => {
    const userId = getUserIdFromCookie(socket);
    if (!userId) return next(new Error("Unauthorized"));
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.id})`);

    // Add user to online map
    if (onlineUsers.has(socket.userId)) {
      onlineUsers.get(socket.userId).push(socket.id);
    } else {
      onlineUsers.set(socket.userId, [socket.id]);
    }

    // Broadcast online users to all clients
    io.emit("online_users", Array.from(onlineUsers.keys()));

    // Join conversation room
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    // Typing indicator
    socket.on("typing", ({ conversationId }) => {
      socket.to(conversationId).emit("typing", socket.userId);
    });

    // Send message (DB save + emit)
    socket.on("send_message", async ({ conversationId, text, media }) => {
      if (!conversationId || (!text && !media)) return;

      try {
        // Save message to DB
        const message = await Message.create({
          conversationId,
          sender: socket.userId,
          text,
          media,
          seenBy: [socket.userId],
        });

        // Update conversation's lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id).populate(
          "sender",
          "username name profileImage"
        );

        // Emit to conversation room **except sender**
        socket.to(conversationId).emit("receive_message", populatedMessage);

        // Emit to sender separately (optional, for optimistic UI)
        socket.emit("receive_message", populatedMessage);
      } catch (err) {
        console.error("Socket send_message error:", err);
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId} (${socket.id})`);

      if (onlineUsers.has(socket.userId)) {
        const updatedSockets = onlineUsers
          .get(socket.userId)
          .filter((id) => id !== socket.id);

        if (updatedSockets.length > 0) {
          onlineUsers.set(socket.userId, updatedSockets);
        } else {
          onlineUsers.delete(socket.userId);
        }
      }

      // Broadcast updated online users
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

// Getter for io instance
export const getIO = () => io;
