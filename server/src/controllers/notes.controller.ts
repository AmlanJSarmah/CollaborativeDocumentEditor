import type { Request, Response, NextFunction } from 'express';
import { createNoteSchema, deleteNoteSchema } from '../schemas/notes.schema.js';
import {
  createNoteService,
  deleteNoteService,
} from '../services/notes.services.js';

export const createNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = createNoteSchema.parse(req.body);
    const note = await createNoteService(title, req.authorizedUser!);
    res.status(202).json({ message: 'Note Created', note: note });
  } catch (err) {
    next(err);
  }
};

export const deleteNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { noteId } = deleteNoteSchema.parse(req.params);
    await deleteNoteService(noteId, req.authorizedUser!);
    res.status(202).json({ message: 'Note Deleted' });
  } catch (err) {
    next(err);
  }
};
