import { getPrisma } from '../lib/prisma.js';
import { addCallParticipant, clearCallParticipants, emitToConversation, emitToUser, getCallParticipants } from '../services/realtime.js';

function userSelect() {
  return { id: true, name: true, email: true, role: true, avatar: true, lastSeen: true, nameEmoji: true, nameEmojiAnim: true };
}

async function findDirectConversation(prisma, userA, userB) {
  const rows = await prisma.conversation.findMany({
    where: {
      type: 'direct',
      members: { every: { userId: { in: [userA, userB] } } },
    },
    include: { members: true },
  });
  return rows.find((c) => c.members.length === 2 && c.members.some((m) => m.userId === userA) && c.members.some((m) => m.userId === userB));
}

function serializeConversation(c, currentUserId) {
  const other = c.members?.find((m) => m.userId !== currentUserId)?.user;
  const unread = c.members?.find((m) => m.userId === currentUserId)?.unreadCount || 0;
  const activeCall = c.calls?.[0]
    ? {
        ...c.calls[0],
        participants: getCallParticipants(c.calls[0].id),
        participantsCount: Math.max(getCallParticipants(c.calls[0].id).length, c.calls[0].calleeId ? 2 : 1),
      }
    : null;
  return {
    id: c.id,
    conversationId: c.id,
    type: c.type,
    title: c.type === 'group' ? c.title : other?.name,
    name: c.type === 'group' ? c.title : other?.name,
    email: other?.email,
    role: c.type === 'group' ? 'group' : other?.role,
    avatar: other?.avatar,
    nameEmoji: c.type === 'group' ? null : other?.nameEmoji,
    nameEmojiAnim: c.type === 'group' ? null : other?.nameEmojiAnim,
    lastSeen: other?.lastSeen,
    unreadCount: unread,
    members: c.members?.map((m) => m.user),
    lastMessage: callMessageLabel(c.messages?.[0]?.text) || c.messages?.[0]?.text || '',
    activeCall,
    updatedAt: c.updatedAt,
  };
}

function callMessagePayload(call, status) {
  const startedAt = call.createdAt ? new Date(call.createdAt) : null;
  const endedAt = call.endedAt ? new Date(call.endedAt) : null;
  const durationSeconds = startedAt && endedAt ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)) : null;
  return `__CALL__:${JSON.stringify({
    callId: call.id,
    type: call.type,
    status,
    conversationId: call.conversationId,
    createdAt: call.createdAt,
    endedAt: call.endedAt,
    durationSeconds,
  })}`;
}

function callMessageLabel(text = '') {
  if (!String(text).startsWith('__CALL__:')) return '';
  try {
    const payload = JSON.parse(String(text).slice('__CALL__:'.length));
    const typeLabel = payload.type === 'video' ? 'Video qo‘ng‘iroq' : 'Audio qo‘ng‘iroq';
    if (payload.status === 'ended') return `${typeLabel} yakunlandi`;
    return `${typeLabel} boshlandi`;
  } catch {
    return 'Qo‘ng‘iroq';
  }
}

async function createSystemCallMessage(prisma, call, status) {
  if (!call.conversationId) return null;
  if (status !== 'started') {
    const existing = await prisma.message.findFirst({
      where: {
        conversationId: call.conversationId,
        text: { contains: `"callId":"${call.id}"` },
      },
      include: { attachments: true, sender: { select: userSelect() } },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      const message = await prisma.message.update({
        where: { id: existing.id },
        data: { text: callMessagePayload(call, status) },
        include: { attachments: true, sender: { select: userSelect() } },
      });
      emitToConversation(call.conversationId, 'message:update', { conversationId: call.conversationId, message });
      return message;
    }
  }
  const conversation = await prisma.conversation.findUnique({
    where: { id: call.conversationId },
    include: { members: true },
  });
  if (!conversation) return null;
  const receiverId = conversation.type === 'direct'
    ? conversation.members.find((m) => m.userId !== call.callerId)?.userId || call.callerId
    : call.callerId;
  const message = await prisma.message.create({
    data: {
      senderId: call.callerId,
      receiverId,
      conversationId: call.conversationId,
      text: callMessagePayload(call, status),
    },
    include: { attachments: true, sender: { select: userSelect() } },
  });
  await prisma.conversation.update({ where: { id: call.conversationId }, data: { updatedAt: new Date() } });
  await prisma.conversationMember.updateMany({
    where: { conversationId: call.conversationId, userId: { not: call.callerId } },
    data: { unreadCount: { increment: 1 } },
  });
  emitToConversation(call.conversationId, 'message:new', { conversationId: call.conversationId, message });
  return message;
}

export async function searchUsers(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { studentId: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: userSelect(),
      take: 20,
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createInvite(req, res) {
  try {
    const { receiverId, message } = req.body;
    if (!receiverId || receiverId === req.user.id) return res.status(400).json({ message: 'receiverId noto‘g‘ri' });
    const prisma = getPrisma();
    const receiver = await prisma.user.findUnique({ where: { id: String(receiverId) }, select: { id: true } });
    if (!receiver) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });

    const existingConversation = await findDirectConversation(prisma, req.user.id, String(receiverId));
    if (existingConversation) return res.json({ status: 'accepted', conversationId: existingConversation.id });

    const existingInvite = await prisma.conversationInvite.findFirst({
      where: {
        status: 'pending',
        OR: [
          { requesterId: req.user.id, receiverId: String(receiverId) },
          { requesterId: String(receiverId), receiverId: req.user.id },
        ],
      },
      include: { requester: { select: userSelect() }, receiver: { select: userSelect() } },
    });
    if (existingInvite) return res.json(existingInvite);

    const invite = await prisma.conversationInvite.create({
      data: { requesterId: req.user.id, receiverId: String(receiverId), message: message || null },
      include: { requester: { select: userSelect() }, receiver: { select: userSelect() } },
    });
    emitToUser(String(receiverId), 'invite:new', invite);
    res.status(201).json(invite);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function listInvites(req, res) {
  try {
    const prisma = getPrisma();
    const invites = await prisma.conversationInvite.findMany({
      where: { OR: [{ requesterId: req.user.id }, { receiverId: req.user.id }] },
      include: { requester: { select: userSelect() }, receiver: { select: userSelect() }, conversation: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const incoming = invites.filter((i) => i.receiverId === req.user.id && i.status === 'pending');
    const outgoing = invites.filter((i) => i.requesterId === req.user.id && i.status === 'pending');
    res.json({ incoming, outgoing, all: invites, pendingCount: incoming.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function respondInvite(req, res) {
  try {
    const { inviteId } = req.params;
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'action accept/reject bo‘lishi kerak' });
    const prisma = getPrisma();
    const invite = await prisma.conversationInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.receiverId !== req.user.id) return res.status(404).json({ message: 'Taklif topilmadi' });
    if (invite.status !== 'pending') return res.status(400).json({ message: 'Taklif allaqachon yakunlangan' });

    if (action === 'reject') {
      const updated = await prisma.conversationInvite.update({
        where: { id: inviteId },
        data: { status: 'rejected' },
        include: { requester: { select: userSelect() }, receiver: { select: userSelect() } },
      });
      emitToUser(invite.requesterId, 'invite:rejected', updated);
      return res.json(updated);
    }

    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: 'direct',
          createdById: invite.requesterId,
          members: {
            create: [
              { userId: invite.requesterId, role: 'member' },
              { userId: invite.receiverId, role: 'member' },
            ],
          },
        },
      });
      const updated = await tx.conversationInvite.update({
        where: { id: inviteId },
        data: { status: 'accepted', conversationId: conversation.id },
      });
      return { conversation, invite: updated };
    });
    emitToUser(invite.requesterId, 'invite:accepted', result);
    emitToUser(invite.receiverId, 'invite:accepted', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createGroup(req, res) {
  try {
    const { title, memberIds = [] } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Guruh nomi talab qilinadi' });
    const prisma = getPrisma();
    const uniqueMembers = Array.from(new Set([req.user.id, ...memberIds.map(String)]));
    const conversation = await prisma.conversation.create({
      data: {
        type: 'group',
        title: String(title).trim(),
        createdById: req.user.id,
        members: { create: uniqueMembers.map((userId) => ({ userId, role: userId === req.user.id ? 'owner' : 'member' })) },
      },
      include: { members: { include: { user: { select: userSelect() } } } },
    });
    uniqueMembers.forEach((userId) => emitToUser(userId, 'conversation:new', conversation));
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createCallSession(req, res) {
  try {
    const { conversationId, calleeId, type = 'audio', offer } = req.body;
    const prisma = getPrisma();
    if (conversationId) {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId: String(conversationId), userId: req.user.id } },
      });
      if (!member) return res.status(403).json({ message: 'Suhbatga ruxsat yo‘q' });
    }
    const call = await prisma.callSession.create({
      data: {
        conversationId: conversationId || null,
        callerId: req.user.id,
        calleeId: calleeId || null,
        type: type === 'video' ? 'video' : 'audio',
        offer: offer || null,
      },
    });
    const participants = addCallParticipant(call.id, req.user);
    const payload = { ...call, fromUserId: req.user.id, participants, participantsCount: participants.length };
    await createSystemCallMessage(prisma, call, 'started');
    if (calleeId) emitToUser(String(calleeId), 'call:ring', payload);
    if (conversationId) emitToConversation(String(conversationId), 'call:ring', payload);
    res.status(201).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function updateCallSession(req, res) {
  try {
    const { callId } = req.params;
    const { status, answer, offer } = req.body;
    const prisma = getPrisma();
    const call = await prisma.callSession.findUnique({ where: { id: callId } });
    if (!call) return res.status(404).json({ message: 'Qo‘ng‘iroq topilmadi' });
    const isParticipant = [call.callerId, call.calleeId].includes(req.user.id);
    const isConversationMember = call.conversationId
      ? await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId: call.conversationId, userId: req.user.id } },
        })
      : null;
    if (!isParticipant && !isConversationMember) return res.status(404).json({ message: 'Qo‘ng‘iroq topilmadi' });
    const updated = await prisma.callSession.update({
      where: { id: callId },
      data: {
        ...(status ? { status: String(status) } : {}),
        ...(offer ? { offer } : {}),
        ...(answer ? { answer } : {}),
        ...(['ended', 'rejected'].includes(status) ? { endedAt: new Date() } : {}),
      },
    });
    if (status === 'ended' || status === 'rejected') {
      clearCallParticipants(call.id);
      await createSystemCallMessage(prisma, updated, 'ended');
    } else {
      addCallParticipant(call.id, req.user);
    }
    const participants = getCallParticipants(call.id);
    const payload = { ...updated, fromUserId: req.user.id, participants, participantsCount: participants.length };
    if (offer && !answer && !status) return res.json(payload);
    if (call.calleeId) emitToUser(call.calleeId, 'call:answer', payload);
    emitToUser(call.callerId, status === 'ended' ? 'call:end' : 'call:answer', payload);
    if (call.conversationId) emitToConversation(call.conversationId, status === 'ended' ? 'call:end' : 'call:answer', payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Xabar yuborish
export async function sendMessage(req, res) {
  try {
    const { recipientId, conversationId, content, attachments = [] } = req.body;
    const senderId = req.user.id;

    if ((!conversationId && !recipientId) || (!content && !attachments.length)) {
      return res.status(400).json({ message: 'conversationId/recipientId va content yoki attachment talab qilinadi' });
    }

    const prisma = getPrisma();
    let conversation = null;
    let receiverId = recipientId ? String(recipientId) : null;
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: String(conversationId), members: { some: { userId: senderId, status: 'active' } } },
        include: { members: true },
      });
      if (!conversation) return res.status(403).json({ message: 'Suhbatga ruxsat yo‘q' });
      receiverId = conversation.type === 'direct' ? conversation.members.find((m) => m.userId !== senderId)?.userId : null;
    } else {
      conversation = await findDirectConversation(prisma, senderId, receiverId);
      if (!conversation) return res.status(403).json({ message: 'Avval suhbat taklifi qabul qilinishi kerak' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: receiverId || senderId,
        conversationId: conversation.id,
        text: content || '',
        attachments: {
          create: attachments.map((a) => ({
            name: String(a.name || 'file'),
            url: String(a.url),
            mimeType: a.mimeType ? String(a.mimeType) : null,
            size: a.size != null ? Number(a.size) : null,
          })),
        },
      },
      include: { attachments: true, sender: { select: userSelect() } },
    });

    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
    await prisma.conversationMember.updateMany({
      where: { conversationId: conversation.id, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    // Telegram bildirishnoma yuborish
    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId }, select: { name: true, role: true } }),
      receiverId ? prisma.user.findUnique({ where: { id: receiverId }, select: { telegramId: true } }) : null,
    ]);

    if (recipient?.telegramId) {
      import('../services/telegramBot.js').then(({ sendNotification }) => {
        let prefix = `📩 <b>Yangi xabar!</b>\nKimdan: <b>${sender.name}</b> (${sender.role})\n`;

        sendNotification(recipient.telegramId, `${prefix}---\n<i>${content}</i>`);
      });
    }

    emitToConversation(conversation.id, 'message:new', { conversationId: conversation.id, message });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Foydalanuvchi bilan bo'lgan barcha xabarlar (Chat tarixi)
export async function getChatHistory(req, res) {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    const prisma = getPrisma();
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: otherUserId,
        members: { some: { userId, status: 'active' } },
      },
    }) || await findDirectConversation(prisma, userId, otherUserId);
    if (conversation) {
      await prisma.conversationMember.updateMany({
        where: { conversationId: conversation.id, userId },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });
      const messages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        include: { attachments: true, sender: { select: userSelect() } },
        orderBy: { createdAt: 'asc' },
      });
      return res.json(messages);
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// Barcha kontaktlar (kimlar bilan yozishgan bo'lsa)
export async function getContacts(req, res) {
  try {
    const userId = req.user.id;
    const prisma = getPrisma();
    const conversations = await prisma.conversation.findMany({
      where: { members: { some: { userId, status: 'active' } } },
      include: {
        members: { include: { user: { select: userSelect() } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        calls: { where: { status: { in: ['ringing', 'accepted'] } }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    if (conversations.length) {
      return res.json(conversations.map((c) => serializeConversation(c, userId)));
    }

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
        receiver: { select: { id: true, name: true, email: true, role: true, avatar: true, nameEmoji: true, nameEmojiAnim: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const contactsMap = new Map();
    for (const msg of messages) {
      const other = msg.senderId === userId ? msg.receiver : msg.sender;
      if (other?.id && other.id !== userId) contactsMap.set(other.id, other);
    }

    res.json(Array.from(contactsMap.values()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
