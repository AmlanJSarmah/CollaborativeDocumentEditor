import type { Request, Response, NextFunction } from 'express';
import { queryNoteSchema } from '../schemas/rag.schemas.js';
import type { QueryNoteResponse } from '../types/rag.types.js';
import { queryNoteService } from '../services/rag.service.js';

export const queryNoteController = async (
  req: Request,
  res: Response<QueryNoteResponse>,
  next: NextFunction
) => {
  try {
    const query = queryNoteSchema.parse(req.body);
    const data = await queryNoteService(query);
    res.status(200).send({ message: 'Query Successful', response: data });
  } catch (err) {
    next(err);
  }
};
