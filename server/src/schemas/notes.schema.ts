import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string(),
});

export const deleteNoteSchema = z.object({
  noteId: z.string(),
});

export const grantAccessSchema = z.object({
  userEmail: z.string(),
  noteId: z.string(),
});
