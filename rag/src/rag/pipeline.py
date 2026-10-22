from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate

# Initializations
embeddings = OllamaEmbeddings(model="nomic-embed-text")
llm = ChatOllama(model="llama3.2:3b", temperature=0.0)
vector_store = Chroma(collection_name="notes_collection", embedding_function=embeddings, persist_directory="./chroma_db")
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

# Functionality
def index_notes(note_id: str, content: str, title: str = "Untitled") -> int:
    # Handle empty content
    if not content.strip():
        return 0
    # Clean up old data
    vector_store.delete(where={"note_id": note_id})
    # Split document
    chuncks = text_splitter.create_documents(texts=[content], metadatas=[{"note_id" : note_id, "title": title}])
    # Store data
    vector_store.add_documents(chuncks)
    return len(chuncks)

def query_notes(note_id: str, question: str):
    # Top k similar results
    results = vector_store.similarity_search(query=question, k=3, filter={"note_id": note_id})
    if not results:
        return ("Sorry, our inhouse llm only answers questions relevant to the document. Please report to the developers if your question is relevant to the document.", [])
    # Format Context
    context_text = "\n\n".join([doc.page_content for doc in results])
    sources = [doc.metadata.get("title", "Untitled") for doc in results]
    # Prompting
    prompt = ChatPromptTemplate.from_template(""" 
        You are an assistant answering questions about a personal note.
        Use ONLY the following context to answer the question.
        If the answer is not contained in the context, say "I couldn't find that in the note."
        Keep your answer concise and factual.

        Context:
        {context}

        Question: {question}
        Answer:
    """)
    chain = prompt | llm
    response = chain.invoke({"context": context_text, "question": question})
    return response.content, sources

# note = "ACID properties are a set of four core guarantees that ensure database transactions are processed reliably and maintain data integrity, even during system crashes or errors."
# index_notes("abc", note, "ACID")
# print(query_notes("abc", "What are ACID properties ?"))
# print(query_notes("abc", "hello there how are you"))