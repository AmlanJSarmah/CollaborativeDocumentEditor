import express from 'express';
import {
  createNoteController,
  deleteNoteController,
} from '../controllers/notes.controller.js';

const router = express.Router();

router.post('/create', createNoteController);
router.get('/delete/:noteId', deleteNoteController);

export default router;
