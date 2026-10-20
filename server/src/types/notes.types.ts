import { z } from 'zod';
import { authorizedUserSchmea } from '../schemas/auth.schema.js';
import { createNoteSchema } from '../schemas/notes.schema.js';

export type User = z.infer<typeof authorizedUserSchmea>;

export type Note = {
  id: string;
  data: string;
  title: string;
  version: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateNoteResponse = {
  message: string;
  note: Note;
};

export type DeleteNoteResponse = {
  message: string;
};

export type GrantAccessResponse = {
  message: string;
};

export type GetAllNotesResponse = {
  message: string;
  notes: {
    createdNotes: Note[];
    grantedNotes: Note[];
  };
};

export type GetNoteResponse = {
  message: string;
  note: Note;
};
