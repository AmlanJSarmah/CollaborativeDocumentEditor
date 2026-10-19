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
  if (note.creatorId != user.id)
    throw new AppError(401, 'Note not created by you');
  // If creatorId valid
  await prisma.note.delete({
    where: {
      id: noteId,
    },
  });
};
