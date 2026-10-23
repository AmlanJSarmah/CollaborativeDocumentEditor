import { z } from 'zod';

export const queryNoteSchema = z.object({
  note_id: z.string(),
  question: z.string(),
  chat_history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .default([]),
});
