import express from 'express';
import {
  createNoteController,
  deleteNoteController,
  getAllNotesController,
  grantAccessController,
} from '../controllers/notes.controller.js';

const router = express.Router();

router.post('/create', createNoteController);
router.delete('/delete/:noteId', deleteNoteController);
router.patch('/add/user/', grantAccessController);
router.get('/get-all-notes', getAllNotesController);

export default router;
