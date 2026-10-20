import type { Socket, Server } from 'socket.io';

export const registerNoteHandler = (io: Server, socket: Socket) => {
  socket.on('note:join', async (data: { noteId: string }) => {
    const { noteId } = data;
    const user = socket.data.user;

    const roomName = `note:${noteId}`;
    await socket.join(roomName);
    console.info(`INFO: User ${user.id} joined ${roomName}`);

    socket
      .to(roomName)
      .emit('user:joined', { userId: user.id, userEmail: user.email });
  });
};
