from pydantic import BaseModel

class IndexNoteRequest(BaseModel):
    note_id: str
    content: str
    title: str = "Untitled"

class IndexNoteResponse(BaseModel):
    message: str
    note_id: str
    chuncks_count: int

class QueryNoteRequest(BaseModel):
    note_id: str
    question: str

class QueryNoteResponse(BaseModel):
    answer: str
    source: list[str]