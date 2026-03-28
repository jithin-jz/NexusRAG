# NexusRAG

A full-stack Retrieval-Augmented Generation (RAG) application.

## 🏗️ Architecture

- **Frontend**: React application built with Vite and designed with Tailwind CSS.
- **Backend**: Python-based backend handling the RAG pipeline, utilizing ChromaDB for vector storage.
- **Deployment**: Configured for seamless deployment via Docker Compose.

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ (for local backend development)

### Running with Docker Compose

The easiest way to get the entire project up and running is with Docker:

```bash
# From the root directory
docker-compose up --build
```

---

### Local Development

#### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (copy `.env.example` to `.env` and fill it out).
5. Start the backend server (typically using `uvicorn` or `python main.py`).

#### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
