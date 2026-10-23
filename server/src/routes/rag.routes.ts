import { Router } from 'express';
import { queryNoteController } from '../controllers/rag.controller.js';

const router = Router();

router.post('/query', queryNoteController);

export default router;
