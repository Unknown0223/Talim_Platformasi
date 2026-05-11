import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { getPrisma } from '../lib/prisma.js';

const onlineUsers = new Map();
const callParticipants = new Map();

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

export function emitToUser(userId, event, payload) {
  globalThis.__talimIo?.to(`user:${userId}`).emit(event, payload);
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  for (const socketId of sockets) {
    globalThis.__talimIo?.to(socketId).emit(event, payload);
  }
}

export function emitToConversation(conversationId, event, payload) {
  globalThis.__talimIo?.to(`conversation:${conversationId}`).emit(event, payload);
}

export function addCallParticipant(callId, user) {
  if (!callId || !user?.id) return [];
  const key = String(callId);
  const current = callParticipants.get(key) || new Map();
  current.set(String(user.id), { id: user.id, name: user.name, role: user.role });
  callParticipants.set(key, current);
  return Array.from(current.values());
}

export function clearCallParticipants(callId) {
  if (callId) callParticipants.delete(String(callId));
}

export function getCallParticipants(callId) {
  return Array.from((callParticipants.get(String(callId)) || new Map()).values());
}

export function setupRealtime(server, corsOrigins) {
  const io = new Server(server, {
    cors: { origin: corsOrigins.length ? corsOrigins : true, credentials: true },
  });
  globalThis.__talimIo = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Token talab qilinadi'));
      const decoded = jwt.verify(String(token), process.env.JWT_SECRET || 'secret');
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true },
      });
      if (!user) return next(new Error('Foydalanuvchi topilmadi'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Token noto‘g‘ri yoki muddati tugagan'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    const sockets = onlineUsers.get(userId) || new Set();
    sockets.add(socket.id);
    onlineUsers.set(userId, sockets);
    socket.join(`user:${userId}`);

    const prisma = getPrisma();

    socket.on('conversation:join', async ({ conversationId }) => {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      }).catch(() => null);
      if (member?.status === 'active') socket.join(`conversation:${conversationId}`);
    });

    for (const event of ['call:ring', 'call:offer', 'call:answer', 'call:ice', 'call:end']) {
      socket.on(event, (payload = {}) => {
        if (payload.fromUserId && String(payload.fromUserId) === String(userId)) return;
        const nextPayload = { ...payload, fromUserId: userId };
        if (payload.toUserId && String(payload.toUserId) !== String(userId)) emitToUser(String(payload.toUserId), event, nextPayload);
        if (payload.conversationId) socket.to(`conversation:${payload.conversationId}`).emit(event, nextPayload);
      });
    }

    await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } }).catch(() => {});
    io.emit('presence:update', { userId, online: true });

    const memberships = await prisma.conversationMember
      .findMany({ where: { userId, status: 'active' }, select: { conversationId: true } })
      .catch(() => []);
    memberships.forEach((m) => socket.join(`conversation:${m.conversationId}`));

    socket.on('disconnect', async () => {
      const set = onlineUsers.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } }).catch(() => {});
          io.emit('presence:update', { userId, online: false });
        }
      }
    });
  });

  return io;
}
