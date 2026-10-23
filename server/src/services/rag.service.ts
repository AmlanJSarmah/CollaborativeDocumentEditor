import { z } from 'zod';
import { env } from '../lib/env.js';
import { queryNoteSchema } from '../schemas/rag.schemas.js';
import { AppError } from '../lib/error.js';

export const ingestNoteService = (
  noteId: string,
  content: string,
  title: string
) => {
  const payload = { note_id: noteId, content, title };
  fetch(`${env.RAG_API_URL}/notes/index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('ERROR : Failed to ingest');
      }
      return response.json();
    })
    .then(data => {
      console.info('INFO : Ingested ' + data.chuncks_count);
    })
    .catch(err => console.error(err.message));
};

export const queryNoteService = async (
  query: z.infer<typeof queryNoteSchema>
) => {
  const response = await fetch(`${env.RAG_API_URL}/notes/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });
  if (!response.ok) throw new AppError(503, 'RAG Service Unavailable');
  const data = await response.json();
  return data;
};
