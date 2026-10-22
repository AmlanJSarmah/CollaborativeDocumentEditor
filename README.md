# Folio

**Folio** is a real-time collaborative markdown document editor featuring distributed concurrency control and an integrated Retrieval-Augmented Generation (RAG) assistant for semantic querying over notes.

---

## Features

- **Real-Time Collaboration**: Bi-directional document synchronization and presence management using Socket.io WebSocket rooms.
- **Distributed Concurrency Control**: Single-writer lock mechanism implemented with Redis atomic leases (`SET NX PX`), heartbeat lease renewals, and automatic cleanup upon client disconnect.
- **Tiered Storage Architecture**: High-speed in-memory caching and write-buffering via Redis, with write-back persistence to PostgreSQL via Prisma ORM on session completion.
- **Contextual AI Assistant**: Document-level RAG pipeline built with FastAPI, LangChain, and ChromaDB to support vector similarity search and question answering over private notes.
- **Secure Access Management**: Token-based authentication with JWT across both REST endpoints and WebSocket handshakes, enforcing strict document-level access control.

---

## Architecture

```text
                  +-----------------------------------+
                  |        Client (React 19)          |
                  +-----------------+-----------------+
                                    |
                    REST (HTTP) / WebSockets (WS)
                                    |
                                    v
                  +-----------------------------------+
                  |     Server (Express 5 + Socket.io)|
                  +--------+-----------------+--------+
                           |                 |
             Atomic Locks  |                 | Document Storage
             & Draft Cache |                 | & User Access
                           v                 v
                  +----------------+   +-------------------+
                  |     Redis      |   |   PostgreSQL      |
                  |  (ioredis)     |   |   (Prisma ORM)    |
                  +----------------+   +-------------------+
                           |
                    Context Chunks
                           v
                  +-----------------------------------+
                  |     RAG Service (FastAPI)         |
                  |  LangChain  |  ChromaDB  |  LLM   |
                  +-----------------------------------+
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Socket.io Client |
| **Backend** | Node.js, Express 5, TypeScript, Socket.io, Zod |
| **Data & Caching** | PostgreSQL 17, Prisma ORM, Redis 7 (ioredis) |
| **AI / RAG** | Python, FastAPI, LangChain, ChromaDB |
| **Infrastructure** | Docker, Docker Compose |

---

## WebSocket Event Reference

| Event | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `note:join` | Client $\rightarrow$ Server | `{ noteId }` | Subscribes socket to note room; receives lock status |
| `lock:status` | Server $\rightarrow$ Client | `{ noteId, isLocked, lockedBy }` | Emits current lock state of the document |
| `lock:claim` | Client $\rightarrow$ Server | `{ noteId }` | Attempts atomic lock acquisition in Redis |
| `lock:acquired`| Server $\rightarrow$ Room | `{ noteId, userId }` | Broadcasts successful lock acquisition |
| `lock:failed` | Server $\rightarrow$ Client | `{ noteId, message }` | Notifies requester that the note is locked |
| `lock:heartbeat`| Client $\rightarrow$ Server | `{ noteId }` | Renews the 10-second Redis lock TTL during active typing |
| `note:update` | Client $\rightarrow$ Server | `{ noteId, content }` | Streams document updates from current lock holder |
| `note:updated`| Server $\rightarrow$ Room | `{ noteId, content }` | Broadcasts new content to viewers (excluding sender) |
| `lock:release`| Client $\rightarrow$ Server | `{ noteId }` | Persists changes to PostgreSQL and releases Redis lock |
| `lock:released`| Server $\rightarrow$ Room | `{ noteId }` | Notifies room members that the note is available |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Docker](https://www.docker.com/) & Docker Compose

### Environment Setup

Create a `.env` file in the project root:

```env
# Database
POSTGRES_USER=markdown
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=markdown_editor
POSTGRES_PORT=5432
DATABASE_URL="postgresql://markdown:your_secure_password@localhost:5432/markdown_editor?schema=public"

# Redis
REDIS_URL="localhost"
REDIS_PORT=6379

# Server
PORT=8080
JWT_PRIVATE_KEY=your_jwt_secret_key
```

### Running with Docker

Start the database and caching infrastructure:

```bash
docker compose up -d postgres redis
```

### Running Locally

1. **Install dependencies**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Run database migrations & generate Prisma client**:
   ```bash
   cd server
   npx prisma db push
   npx prisma generate
   ```

3. **Start services**:
   ```bash
   # Terminal 1: Backend Server
   cd server && npm run dev

   # Terminal 2: Frontend Client
   cd client && npm run dev
   ```

The client will be running on `http://localhost:5173` and the backend on `http://localhost:8080`.
