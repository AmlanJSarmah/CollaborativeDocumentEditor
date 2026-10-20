import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { AppError } from '../lib/error.js';
import type { User, Note } from '../types/notes.types.js';

export const createNoteService = async (
  title: string,
  user: User
): Promise<Note> => {
  const note = await prisma.note.create({
    data: {
      title: title,
      creator: {
        connect: {
          id: user.id,
        },
      },
    },
  });
  return note;
};

export const deleteNoteService = async (noteId: string, user: User) => {
  // Check if note id and charcter id are same
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });
  if (!note) throw new AppError(404, `Note doesn't exsit`);
  if (note.creatorId != user.id)
    throw new AppError(403, 'Note not created by you');
  // If creatorId valid
  await prisma.accessList.deleteMany({
    where: {
      noteId: note.id,
    },
  });
  await prisma.note.delete({
    where: {
      id: note.id,
    },
  });
};

export const grantAccessService = async (
  userEmail: string,
  noteId: string,
  authorizedUser: User
) => {
  // CASE : User tries to give himself access
  if (userEmail == authorizedUser.email)
    throw new AppError(409, 'Cannot give yourself access');
  // CASE: User trying to give access to note note created by them
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });
  if (!note) throw new AppError(404, "Note doesn't exist");
  if (note.creatorId != authorizedUser.id)
    throw new AppError(
      403,
      "Forbidden cannot give access to someone else's notes"
    );
  // CASE: if access already granted
  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });
  if (!user) throw new AppError(404, "User doesn't exist");
  const isExist = await prisma.accessList.findUnique({
    where: {
      userId_noteId: {
        userId: user.id,
        noteId: note.id,
      },
    },
  });
  if (isExist) throw new AppError(409, 'Access already granted');
  // General Case
  await prisma.accessList.create({
    data: {
      noteId: note.id,
      userId: user.id,
    },
  });
};

export const getAllNotesService = async (user: User) => {
  const createdNotes: Note[] = await prisma.note.findMany({
    where: {
      creatorId: user.id,
    },
  });
  const grantedNotesList = await prisma.accessList.findMany({
    where: {
      userId: user.id,
    },
  });
  let grantedNotes: Note[] = [];
  for (const note of grantedNotesList) {
    grantedNotes.push(
      await prisma.note.findUnique({
        where: {
          id: note.noteId,
        },
      })
    );
  }

  return {
    createdNotes: createdNotes,
    grantedNotes: grantedNotes,
  };
};

export const getNoteService = async (
  noteId: string,
  user: User
): Promise<Note> => {
  // Verify if user is creator or in Access List
  let valid = false;
  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });
  if (!note) throw new AppError(404, "Note doesn't exist");
  const hasAccess = await prisma.accessList.findUnique({
    where: {
      userId_noteId: {
        userId: user.id,
        noteId: note.id,
      },
    },
  });
  if (note.creatorId == user.id || hasAccess) valid = true;
  if (!valid)
    throw new AppError(
      403,
      'Forbidden : You are not a creator / have not been granted access'
    );
  // If valid
  const data = await redis.get(`note:${note.id}`);
  // CACHE HIT
  if (data) return JSON.parse(data);
  // CACHE Miss
  await redis.set(`note:${note.id}`, JSON.stringify(note));
  return note;
};
