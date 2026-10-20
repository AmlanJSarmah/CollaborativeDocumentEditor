import type { Socket, Server } from 'socket.io';
import { redis } from '../../lib/redis.js';
import { prisma } from '../../lib/prisma.js';

export const registerNoteHandler = (io: Server, socket: Socket) => {
  socket.on('note:join', async (data: { noteId: string }) => {
    if (!data?.noteId) return;
    const { noteId } = data;
    const user = socket.data.user;

    const roomName = `note:${noteId}`;
    await socket.join(roomName);
    console.info(`INFO: User ${user.id} joined ${roomName}`);

    const currentLockHolder = await redis.get(`lock:note:${noteId}`);

    socket.emit('lock:status', {
      noteId,
      isLocked: Boolean(currentLockHolder),
      lockedBy: currentLockHolder,
    });
  });

  socket.on('lock:claim', async (data: { noteId: string }) => {
    if (!data?.noteId) return;
    const { noteId } = data;
    const aquired = await redis.set(
      `lock:note:${noteId}`,
      socket.data.user.id,
      'PX',
      10000,
      'NX'
    );
    if (aquired == 'OK') {
      socket.data.heldLocks.add(noteId);
      io.to(`note:${noteId}`).emit('lock:acquired', {
        noteId,
        userId: socket.data.user.id,
      });
    } else {
      socket.emit('lock:failed', {
        noteId,
        message: 'Note is currently locked by another user',
      });
    }
  });

  socket.on('lock:heartbeat', async (data: { noteId: string }) => {
    if (!data?.noteId) return;
    const { noteId } = data;
    const holder = await redis.get(`lock:note:${noteId}`);
    if (holder == socket.data.user.id)
      await redis.pexpire(`lock:note:${noteId}`, 10000);
  });

  socket.on('lock:release', async (data: { noteId: string }) => {
    if (!data?.noteId) return;
    const { noteId } = data;
    const holder = await redis.get(`lock:note:${noteId}`);
    if (holder == socket.data.user.id) {
      const note = await JSON.parse((await redis.get(`note:${noteId}`))!);
      await prisma.note.update({
        where: { id: noteId },
        data: { data: note.data },
      });
      await redis.del(`lock:note:${noteId}`);
      socket.data.heldLocks.delete(noteId);
      io.to(`note:${noteId}`).emit('lock:released', { noteId });
    }
  });

  socket.on(
    'note:update',
    async (data: { noteId: string; content: string }) => {
      if (!data?.noteId || typeof data.content !== 'string') return;
      const { noteId, content } = data;
      const holder = await redis.get(`lock:note:${noteId}`);
      if (holder != socket.data.user.id) {
        socket.emit('update:failed', { noteId });
      } else {
        const note = JSON.parse((await redis.get(`note:${noteId}`))!);
        note.data = content;
        await redis.set(`note:${noteId}`, JSON.stringify(note));
        socket.to(`note:${noteId}`).emit('note:updated', {
          noteId,
          content,
        });
      }
    }
  );
};
