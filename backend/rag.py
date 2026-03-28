from __future__ import annotations

import gc
import json
import os
import re
import secrets
import shutil
import time
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PLATFORM_DIR = DATA_DIR / "platform"
PLATFORM_STATE_PATH = PLATFORM_DIR / "state.json"
BOTS_DIR = PLATFORM_DIR / "bots"
SUPPORTED_EXTENSIONS = {".pdf", ".txt"}

load_dotenv(dotenv_path=BASE_DIR / ".env")

EMBEDDING_MODEL = os.getenv("GOOGLE_EMBEDDING_MODEL", "models/gemini-embedding-001")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GOOGLE_CLOCK_SKEW_SECONDS = int(os.getenv("GOOGLE_CLOCK_SKEW_SECONDS", "60"))
DEFAULT_BOT_THEME = {
    "botTitle": "Support Bot",
    "welcomeMessage": "Hi! Ask me anything about this knowledge base.",
    "placeholder": "Type your message...",
    "primaryColor": "#124170",
    "accentColor": "#c75d2c",
    "surfaceColor": "#fffaf5",
    "textColor": "#182033",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _require_env_var(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@lru_cache(maxsize=1)
def get_embedding_function() -> GoogleGenerativeAIEmbeddings:
    _require_env_var("GOOGLE_API_KEY")
    return GoogleGenerativeAIEmbeddings(model=EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_llm() -> ChatGroq:
    _require_env_var("GROQ_API_KEY")
    return ChatGroq(temperature=0, model_name=GROQ_MODEL)


def _ensure_platform_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PLATFORM_DIR.mkdir(parents=True, exist_ok=True)
    BOTS_DIR.mkdir(parents=True, exist_ok=True)
    if not PLATFORM_STATE_PATH.exists():
        _save_state({"users": [], "bots": [], "sessions": []})


def _load_state() -> dict[str, Any]:
    _ensure_platform_dirs()
    return json.loads(PLATFORM_STATE_PATH.read_text(encoding="utf-8"))


def _save_state(state: dict[str, Any]) -> None:
    PLATFORM_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = PLATFORM_STATE_PATH.with_suffix(".tmp")
    temp_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
    temp_path.replace(PLATFORM_STATE_PATH)


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "bot"


def _bot_root(bot_id: str) -> Path:
    return BOTS_DIR / bot_id


def _bot_documents_dir(bot_id: str) -> Path:
    return _bot_root(bot_id) / "documents"


def _bot_chroma_dir(bot_id: str) -> Path:
    return _bot_root(bot_id) / "chroma"


def _bot_build_marker(bot_id: str) -> Path:
    return _bot_root(bot_id) / ".ready"


def _find_user(state: dict[str, Any], user_id: str) -> dict[str, Any]:
    user = next((item for item in state["users"] if item["id"] == user_id), None)
    if not user:
        raise PermissionError("User not found.")
    return user


def _find_bot(state: dict[str, Any], bot_id: str) -> dict[str, Any]:
    bot = next((item for item in state["bots"] if item["id"] == bot_id), None)
    if not bot:
        raise FileNotFoundError("Bot not found.")
    return bot


def _get_user_bot(state: dict[str, Any], user_id: str, bot_id: str) -> dict[str, Any]:
    bot = _find_bot(state, bot_id)
    if bot["owner_id"] != user_id:
        raise PermissionError("You do not have access to this bot.")
    return bot


def _sanitize_theme_patch(theme_patch: dict[str, Any]) -> dict[str, str]:
    allowed_keys = set(DEFAULT_BOT_THEME)
    cleaned = {}
    for key, value in theme_patch.items():
        if key in allowed_keys and value is not None:
            cleaned[key] = str(value).strip()
    return cleaned


def _bot_signature(bot: dict[str, Any]) -> str:
    parts: list[str] = []
    for document in bot.get("documents", []):
        path = Path(document["path"])
        if not path.exists():
            return ""
        stat = path.stat()
        parts.append(f"{path.resolve()}::{stat.st_mtime_ns}::{stat.st_size}")
    return "|".join(parts)


def _load_documents_for_bot(bot: dict[str, Any]):
    documents = []
    for item in bot.get("documents", []):
        path = Path(item["path"])
        suffix = path.suffix.lower()
        if suffix == ".txt":
            documents.extend(TextLoader(str(path), encoding="utf-8").load())
        elif suffix == ".pdf":
            documents.extend(PyPDFLoader(str(path)).load())
        else:
            raise ValueError(f"Unsupported file type: {suffix}")
    return documents


def _reset_bot_vector_store(bot_id: str) -> None:
    marker = _bot_build_marker(bot_id)
    marker.unlink(missing_ok=True)

    chroma_dir = _bot_chroma_dir(bot_id)
    if not chroma_dir.exists():
        return

    gc.collect()
    for attempt in range(3):
        try:
            shutil.rmtree(chroma_dir)
            return
        except PermissionError:
            if attempt == 2:
                raise
            time.sleep(0.3)
            gc.collect()


def _get_vector_store(bot_id: str) -> Chroma:
    return Chroma(
        collection_name=f"bot_{bot_id}",
        persist_directory=str(_bot_chroma_dir(bot_id)),
        embedding_function=get_embedding_function(),
    )


def _bot_public_payload(bot: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": bot["id"],
        "name": bot["name"],
        "slug": bot["slug"],
        "description": bot.get("description", ""),
        "theme": bot["theme"],
        "public_enabled": bot.get("public_enabled", True),
        "document_count": len(bot.get("documents", [])),
    }


def _bot_owner_payload(bot: dict[str, Any]) -> dict[str, Any]:
    signature = _bot_signature(bot)
    marker = _bot_build_marker(bot["id"])
    return {
        **_bot_public_payload(bot),
        "created_at": bot["created_at"],
        "updated_at": bot["updated_at"],
        "documents": [
            {
                "id": item["id"],
                "original_name": item["original_name"],
                "uploaded_at": item["uploaded_at"],
                "size": item["size"],
                "content_type": item["content_type"],
            }
            for item in bot.get("documents", [])
        ],
        "vector_ready": marker.exists() and marker.read_text(encoding="utf-8") == signature and bool(signature),
    }


def _create_session_for_user(state: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    state["sessions"] = [item for item in state["sessions"] if item["user_id"] != user["id"]]
    session = {"token": token, "user_id": user["id"], "created_at": _now_iso()}
    state["sessions"].append(session)
    _save_state(state)
    return session


def get_user_for_session(session_token: str) -> dict[str, Any]:
    state = _load_state()
    session = next((item for item in state["sessions"] if item["token"] == session_token), None)
    if not session:
        raise PermissionError("Invalid or expired session.")
    user = _find_user(state, session["user_id"])
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "created_at": user["created_at"],
    }


def logout_session(session_token: str) -> None:
    state = _load_state()
    state["sessions"] = [item for item in state["sessions"] if item["token"] != session_token]
    _save_state(state)


def authenticate_google_credential(credential: str) -> dict[str, Any]:
    if not credential:
        raise ValueError("Google credential is required.")

    audience = _require_env_var("GOOGLE_CLIENT_ID")
    payload = id_token.verify_oauth2_token(
        credential,
        GoogleRequest(),
        audience=audience,
        clock_skew_in_seconds=GOOGLE_CLOCK_SKEW_SECONDS,
    )

    google_sub = payload.get("sub")
    email = payload.get("email")
    if not google_sub or not email:
        raise ValueError("Google account details were not available.")

    state = _load_state()
    user = next((item for item in state["users"] if item.get("google_sub") == google_sub), None)
    now = _now_iso()

    if not user:
        user = {
            "id": f"user_{uuid4().hex[:12]}",
            "google_sub": google_sub,
            "email": email,
            "name": payload.get("name") or email.split("@")[0],
            "picture": payload.get("picture"),
            "created_at": now,
            "updated_at": now,
        }
        state["users"].append(user)
    else:
        user["email"] = email
        user["name"] = payload.get("name") or user["name"]
        user["picture"] = payload.get("picture")
        user["updated_at"] = now

    session = _create_session_for_user(state, user)
    return {
        "session_token": session["token"],
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
        },
    }


def create_dev_session(email: str, name: str | None = None) -> dict[str, Any]:
    if os.getenv("ALLOW_DEV_AUTH", "").lower() != "true":
        raise PermissionError("Dev login is disabled.")

    email = email.strip().lower()
    if not email:
        raise ValueError("Email is required.")

    state = _load_state()
    user = next((item for item in state["users"] if item["email"] == email), None)
    now = _now_iso()

    if not user:
        user = {
            "id": f"user_{uuid4().hex[:12]}",
            "google_sub": None,
            "email": email,
            "name": name or email.split("@")[0],
            "picture": None,
            "created_at": now,
            "updated_at": now,
        }
        state["users"].append(user)
    else:
        user["name"] = name or user["name"]
        user["updated_at"] = now

    session = _create_session_for_user(state, user)
    return {
        "session_token": session["token"],
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "picture": user.get("picture"),
        },
    }


def list_bots_for_user(user_id: str) -> list[dict[str, Any]]:
    state = _load_state()
    _find_user(state, user_id)
    return [_bot_owner_payload(bot) for bot in state["bots"] if bot["owner_id"] == user_id]


def create_bot_for_user(user_id: str, name: str, description: str = "") -> dict[str, Any]:
    state = _load_state()
    _find_user(state, user_id)

    name = name.strip()
    if not name:
        raise ValueError("Bot name is required.")

    now = _now_iso()
    base_slug = _slugify(name)
    existing_slugs = {bot["slug"] for bot in state["bots"]}
    slug = base_slug
    counter = 2
    while slug in existing_slugs:
        slug = f"{base_slug}-{counter}"
        counter += 1

    bot = {
        "id": f"bot_{uuid4().hex[:12]}",
        "owner_id": user_id,
        "name": name,
        "slug": slug,
        "description": description.strip(),
        "created_at": now,
        "updated_at": now,
        "public_enabled": True,
        "theme": DEFAULT_BOT_THEME.copy() | {"botTitle": name},
        "documents": [],
    }
    state["bots"].append(bot)
    _save_state(state)
    _bot_documents_dir(bot["id"]).mkdir(parents=True, exist_ok=True)
    return _bot_owner_payload(bot)


def get_bot_for_user(user_id: str, bot_id: str) -> dict[str, Any]:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)
    return _bot_owner_payload(bot)


def update_bot_for_user(
    user_id: str,
    bot_id: str,
    *,
    name: str | None = None,
    description: str | None = None,
    public_enabled: bool | None = None,
) -> dict[str, Any]:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)

    if name is not None:
        name = name.strip()
        if not name:
            raise ValueError("Bot name cannot be empty.")
        bot["name"] = name
        if not bot["theme"].get("botTitle"):
            bot["theme"]["botTitle"] = name
    if description is not None:
        bot["description"] = description.strip()
    if public_enabled is not None:
        bot["public_enabled"] = public_enabled

    bot["updated_at"] = _now_iso()
    _save_state(state)
    return _bot_owner_payload(bot)


def update_bot_theme_for_user(user_id: str, bot_id: str, theme_patch: dict[str, Any]) -> dict[str, Any]:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)
    cleaned = _sanitize_theme_patch(theme_patch)
    if not cleaned:
        raise ValueError("No valid theme fields were provided.")
    bot["theme"].update(cleaned)
    bot["updated_at"] = _now_iso()
    _save_state(state)
    return _bot_owner_payload(bot)


def upload_documents_for_bot(
    user_id: str,
    bot_id: str,
    files: list[tuple[str, bytes, str | None]],
) -> dict[str, Any]:
    if not files:
        raise ValueError("Upload at least one file.")

    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)
    documents_dir = _bot_documents_dir(bot_id)
    documents_dir.mkdir(parents=True, exist_ok=True)

    uploaded_items = []
    for filename, content, content_type in files:
        safe_name = Path(filename or "").name
        suffix = Path(safe_name).suffix.lower()

        if not safe_name:
            raise ValueError("Each uploaded file must have a name.")
        if suffix not in SUPPORTED_EXTENSIONS:
            raise ValueError("Unsupported file type. Please upload PDF or TXT files.")
        if not content:
            raise ValueError(f"{safe_name} is empty.")

        document_id = f"doc_{uuid4().hex[:12]}"
        stored_name = f"{document_id}{suffix}"
        saved_path = documents_dir / stored_name
        saved_path.write_bytes(content)

        document_record = {
            "id": document_id,
            "original_name": safe_name,
            "stored_name": stored_name,
            "path": str(saved_path.resolve()),
            "size": len(content),
            "content_type": content_type or "application/octet-stream",
            "uploaded_at": _now_iso(),
        }
        bot["documents"].append(document_record)
        uploaded_items.append(
            {
                "id": document_id,
                "original_name": safe_name,
                "size": len(content),
                "uploaded_at": document_record["uploaded_at"],
            }
        )

    bot["updated_at"] = _now_iso()
    _save_state(state)

    build_message = build_bot_vector_db(user_id, bot_id)
    return {
        "message": build_message,
        "uploaded_files": uploaded_items,
        "document_count": len(bot["documents"]),
    }


def build_bot_vector_db(user_id: str, bot_id: str) -> str:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)

    if not bot["documents"]:
        raise ValueError("Upload at least one document before building the bot knowledge base.")

    documents = _load_documents_for_bot(bot)
    if not documents:
        raise RuntimeError("No text could be extracted from the uploaded documents.")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    chunks = text_splitter.split_documents(documents)

    _reset_bot_vector_store(bot_id)
    Chroma.from_documents(
        documents=chunks,
        embedding=get_embedding_function(),
        collection_name=f"bot_{bot_id}",
        persist_directory=str(_bot_chroma_dir(bot_id)),
    )
    _bot_build_marker(bot_id).write_text(_bot_signature(bot), encoding="utf-8")

    bot["updated_at"] = _now_iso()
    _save_state(state)
    return f"Indexed {len(bot['documents'])} document(s) into {len(chunks)} chunks."


def _ensure_bot_ready(bot: dict[str, Any]) -> None:
    signature = _bot_signature(bot)
    marker = _bot_build_marker(bot["id"])
    if not signature:
        raise ValueError("This bot has no uploaded documents.")
    if not marker.exists() or marker.read_text(encoding="utf-8") != signature:
        state = _load_state()
        owner_id = _find_bot(state, bot["id"])["owner_id"]
        build_bot_vector_db(owner_id, bot["id"])


def _run_bot_query(bot: dict[str, Any], question: str) -> str:
    question = question.strip()
    if not question:
        raise ValueError("Question cannot be empty.")

    _ensure_bot_ready(bot)
    retriever = _get_vector_store(bot["id"]).as_retriever(search_kwargs={"k": 4})
    system_prompt = (
        "You are an AI assistant for a project's document bot. "
        "Answer only from the provided context. "
        "If the answer is not contained in the documents, say you do not know. "
        "Be concise, factual, and helpful.\n\n"
        "Context:\n{context}"
    )
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("human", "{input}"),
        ]
    )
    chain = (
        {"context": retriever | format_docs, "input": RunnablePassthrough()}
        | prompt
        | get_llm()
        | StrOutputParser()
    )
    return chain.invoke(question)


def query_bot_for_user(user_id: str, bot_id: str, question: str) -> dict[str, Any]:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)
    return {"reply": _run_bot_query(bot, question), "bot": _bot_owner_payload(bot)}


def get_public_bot_config(bot_id: str) -> dict[str, Any]:
    state = _load_state()
    bot = _find_bot(state, bot_id)
    if not bot.get("public_enabled", True):
        raise PermissionError("This bot is not public.")
    return _bot_public_payload(bot)


def query_public_bot(bot_id: str, question: str) -> dict[str, Any]:
    state = _load_state()
    bot = _find_bot(state, bot_id)
    if not bot.get("public_enabled", True):
        raise PermissionError("This bot is not public.")
    return {"reply": _run_bot_query(bot, question), "bot": _bot_public_payload(bot)}


def generate_bot_integration(user_id: str, bot_id: str, base_url: str) -> dict[str, Any]:
    state = _load_state()
    bot = _get_user_bot(state, user_id, bot_id)
    base_url = base_url.rstrip("/")
    public_chat_url = f"{base_url}/api/public/bots/{bot_id}/chat"
    public_config_url = f"{base_url}/api/public/bots/{bot_id}/config"
    widget_url = f"{base_url}/embed/{bot_id}"
    iframe_snippet = (
        f'<iframe src="{widget_url}" title="{bot["name"]}" '
        'style="width: 100%; max-width: 420px; height: 640px; border: 0; border-radius: 20px; overflow: hidden;"></iframe>'
    )
    react_component_code = f"""import {{ useEffect, useState }} from 'react'

const BOT_ID = '{bot_id}'
const API_BASE = '{base_url}'

export default function {re.sub(r'[^A-Za-z0-9]', '', bot['name']) or 'ProjectBot'}Widget() {{
  const [config, setConfig] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {{
    fetch(`${{API_BASE}}/api/public/bots/${{BOT_ID}}/config`)
      .then((response) => response.json())
      .then(setConfig)
  }}, [])

  const sendMessage = async (event) => {{
    event.preventDefault()
    if (!question.trim()) return

    const prompt = question
    setMessages((current) => [...current, {{ role: 'user', content: prompt }}])
    setQuestion('')
    setLoading(true)

    const response = await fetch(`${{API_BASE}}/api/public/bots/${{BOT_ID}}/chat`, {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ question: prompt }}),
    }})
    const data = await response.json()
    setMessages((current) => [...current, {{ role: 'assistant', content: data.reply }}])
    setLoading(false)
  }}

  return (
    <div style={{{{
      width: 380,
      padding: 20,
      borderRadius: 20,
      background: config?.theme?.surfaceColor || '#fffaf5',
      border: '1px solid rgba(18, 65, 112, 0.12)',
      fontFamily: 'system-ui, sans-serif',
    }}}}>
      <h3 style={{{{ marginTop: 0, color: config?.theme?.textColor || '#182033' }}}}>
        {{config?.theme?.botTitle || '{bot["name"]}'}}
      </h3>
      <p style={{{{ color: '#5f6b7d' }}}}>
        {{config?.theme?.welcomeMessage || 'Ask me anything about these documents.'}}
      </p>
      <div style={{{{ display: 'grid', gap: 12, minHeight: 260, marginBottom: 16 }}}}>
        {{messages.map((message, index) => (
          <div
            key={{index}}
            style={{{{
              padding: 12,
              borderRadius: 14,
              background: message.role === 'assistant' ? '#ffffff' : (config?.theme?.primaryColor || '#124170'),
              color: message.role === 'assistant' ? '#182033' : '#ffffff',
            }}}}
          >
            {{message.content}}
          </div>
        ))}}
      </div>
      <form onSubmit={{sendMessage}} style={{{{ display: 'grid', gap: 10 }}}}>
        <input
          value={{question}}
          onChange={{(event) => setQuestion(event.target.value)}}
          placeholder={{config?.theme?.placeholder || 'Type your message...'}}
          style={{{{
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(18, 65, 112, 0.12)',
          }}}}
        />
        <button
          type="submit"
          disabled={{loading}}
          style={{{{
            padding: 12,
            border: 0,
            borderRadius: 12,
            background: config?.theme?.primaryColor || '#124170',
            color: '#ffffff',
          }}}}
        >
          {{loading ? 'Thinking...' : 'Send'}}
        </button>
      </form>
    </div>
  )
}}"""
    return {
        "widget_url": widget_url,
        "public_chat_url": public_chat_url,
        "public_config_url": public_config_url,
        "iframe_snippet": iframe_snippet,
        "react_component_code": react_component_code,
    }


def render_widget_html(bot_id: str, base_url: str) -> str:
    bot = get_public_bot_config(bot_id)
    theme = bot["theme"]
    escaped_welcome = json.dumps(theme["welcomeMessage"])
    escaped_title = json.dumps(theme["botTitle"])
    escaped_placeholder = json.dumps(theme["placeholder"])
    public_chat_url = f"{base_url.rstrip('/')}/api/public/bots/{bot_id}/chat"

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{bot['name']} Widget</title>
    <style>
      :root {{
        --primary: {theme['primaryColor']};
        --accent: {theme['accentColor']};
        --surface: {theme['surfaceColor']};
        --text: {theme['textColor']};
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        font-family: system-ui, sans-serif;
        background: linear-gradient(180deg, #f3ede2 0%, #ece8df 100%);
        color: var(--text);
      }}
      .shell {{
        width: 100%;
        min-height: 100vh;
        padding: 16px;
      }}
      .card {{
        height: calc(100vh - 32px);
        background: var(--surface);
        border-radius: 24px;
        border: 1px solid rgba(18, 65, 112, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }}
      .header {{
        padding: 18px;
        background: linear-gradient(135deg, var(--primary), var(--accent));
        color: #fff;
      }}
      .messages {{
        flex: 1;
        padding: 18px;
        overflow: auto;
        display: grid;
        gap: 12px;
        background: rgba(255,255,255,0.4);
      }}
      .bubble {{
        max-width: 85%;
        padding: 12px 14px;
        border-radius: 16px;
        line-height: 1.5;
        white-space: pre-wrap;
      }}
      .assistant {{ background: #fff; }}
      .user {{
        margin-left: auto;
        background: var(--primary);
        color: #fff;
      }}
      .composer {{
        display: grid;
        gap: 10px;
        padding: 16px;
        border-top: 1px solid rgba(18, 65, 112, 0.08);
      }}
      textarea {{
        width: 100%;
        min-height: 90px;
        resize: none;
        border-radius: 14px;
        border: 1px solid rgba(18, 65, 112, 0.12);
        padding: 12px;
        font: inherit;
      }}
      button {{
        border: 0;
        border-radius: 14px;
        padding: 12px;
        background: var(--primary);
        color: #fff;
        font: inherit;
        cursor: pointer;
      }}
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="card">
        <div class="header">
          <strong id="bot-title"></strong>
          <p id="bot-welcome" style="margin: 8px 0 0;"></p>
        </div>
        <div class="messages" id="messages"></div>
        <form class="composer" id="chat-form">
          <textarea id="question" placeholder=""></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
    <script>
      const state = {{
        messages: [{{ role: 'assistant', content: {escaped_welcome} }}],
      }};
      const messagesEl = document.getElementById('messages');
      const titleEl = document.getElementById('bot-title');
      const welcomeEl = document.getElementById('bot-welcome');
      const questionEl = document.getElementById('question');
      titleEl.textContent = {escaped_title};
      welcomeEl.textContent = {escaped_welcome};
      questionEl.placeholder = {escaped_placeholder};

      function render() {{
        messagesEl.innerHTML = state.messages.map((message) => `
          <div class="bubble ${{message.role}}">
            ${{message.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}}
          </div>
        `).join('');
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }}

      render();

      document.getElementById('chat-form').addEventListener('submit', async (event) => {{
        event.preventDefault();
        const question = questionEl.value.trim();
        if (!question) return;

        state.messages.push({{ role: 'user', content: question }});
        questionEl.value = '';
        render();

        const response = await fetch({json.dumps(public_chat_url)}, {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ question }}),
        }});
        const data = await response.json();
        state.messages.push({{
          role: 'assistant',
          content: data.reply || data.detail || 'Sorry, something went wrong.',
        }});
        render();
      }});
    </script>
  </body>
</html>"""


def format_docs(docs) -> str:
    return "\n\n".join(doc.page_content for doc in docs)
