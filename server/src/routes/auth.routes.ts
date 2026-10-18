import express from 'express';
import {
  signInController,
  signUpController,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signUpController);
router.post('/signin', signInController);

export default router;
