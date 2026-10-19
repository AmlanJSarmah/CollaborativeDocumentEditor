import { z } from 'zod';
import { authorizedUserSchmea } from '../schemas/auth.schema.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/error.js';

type User = z.infer<typeof authorizedUserSchmea>;

export const createNoteService = async (title: string, user: User) => {
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
  const createdNotes = await prisma.note.findMany({
    where: {
      creatorId: user.id,
    },
  });
  const grantedNotesList = await prisma.accessList.findMany({
    where: {
      userId: user.id,
    },
  });
  let grantedNotes: any = [];
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
