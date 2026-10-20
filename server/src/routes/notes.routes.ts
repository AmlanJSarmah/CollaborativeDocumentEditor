import express from 'express';
import {
  createNoteController,
  deleteNoteController,
  getAllNotesController,
  getNoteController,
  grantAccessController,
} from '../controllers/notes.controller.js';

const router = express.Router();

router.post('/create', createNoteController);
router.delete('/delete/:noteId', deleteNoteController);
router.patch('/add/user/', grantAccessController);
router.get('/get-all-notes', getAllNotesController);
router.get('/get/:noteId', getNoteController);

export default router;
