from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import (IndexNoteRequest, IndexNoteResponse, QueryNoteRequest, QueryNoteResponse)
from .pipeline import index_notes, query_notes

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"])

@app.get('/health-status')
def helth_check():
    return {"message" : "status healthy"}

@app.post('/notes/index', response_model=IndexNoteResponse, status_code=200)
def index_notes_controller(req: IndexNoteRequest):
    count = index_notes(req.note_id, req.note_id, req.title)
    return {"message": "File Ingested", "note_id": req.note_id, "chuncks_count": count}

@app.post('/notes/query', response_model=QueryNoteResponse, status_code=200)
def query_notes_controller(req: QueryNoteRequest):
    chat_history = [msg.model_dump() for msg in req.chat_history]
    response, source = query_notes(req.note_id, req.question, chat_history)
    return {"answer": response, "source": source}