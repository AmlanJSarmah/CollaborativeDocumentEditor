import type { Request, Response, NextFunction } from 'express';
import {
  createNoteSchema,
  deleteNoteSchema,
  grantAccessSchema,
} from '../schemas/notes.schema.js';
import {
  createNoteService,
  deleteNoteService,
  getAllNotesService,
  grantAccessService,
} from '../services/notes.services.js';

export const createNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title } = createNoteSchema.parse(req.body);
    const note = await createNoteService(title, req.authorizedUser!);
    res.status(201).json({ message: 'Note Created', note: note });
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
    res.status(200).json({ message: 'Note Deleted' });
  } catch (err) {
    next(err);
  }
};

export const grantAccessController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userEmail, noteId } = grantAccessSchema.parse(req.body);
    await grantAccessService(userEmail, noteId, req.authorizedUser!);
    res.status(200).json({ message: 'Access Granted' });
  } catch (err) {
    next(err);
  }
};

export const getAllNotesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notes = await getAllNotesService(req.authorizedUser!);
    res.status(200).json({ message: 'Query Success', notes });
  } catch (err) {
    next(err);
  }
};
