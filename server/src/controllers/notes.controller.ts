import type { Request, Response, NextFunction } from 'express';
import {
  createNoteSchema,
  deleteNoteSchema,
  getNoteSchema,
  grantAccessSchema,
} from '../schemas/notes.schema.js';
import {
  createNoteService,
  deleteNoteService,
  getAllNotesService,
  getNoteService,
  grantAccessService,
} from '../services/notes.services.js';
import type {
  CreateNoteResponse,
  DeleteNoteResponse,
  GrantAccessResponse,
  GetAllNotesResponse,
  GetNoteResponse,
} from '../types/notes.types.js';

export const createNoteController = async (
  req: Request,
  res: Response<CreateNoteResponse>,
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
  res: Response<DeleteNoteResponse>,
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
  res: Response<GrantAccessResponse>,
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
  res: Response<GetAllNotesResponse>,
  next: NextFunction
) => {
  try {
    const notes = await getAllNotesService(req.authorizedUser!);
    res.status(200).json({ message: 'Query Success', notes });
  } catch (err) {
    next(err);
  }
};

export const getNoteController = async (
  req: Request,
  res: Response<GetNoteResponse>,
  next: NextFunction
) => {
  try {
    const { noteId } = getNoteSchema.parse(req.params);
    const note = await getNoteService(noteId, req.authorizedUser!);
    return res.status(200).json({ message: 'Note Retrieved', note: note });
  } catch (err) {
    next(err);
  }
};
