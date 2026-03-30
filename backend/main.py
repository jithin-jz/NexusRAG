import os
import traceback
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

try:
    from .rag import (
        authenticate_google_credential,
        build_bot_vector_db,
        create_bot_for_user,
        create_dev_session,
        generate_bot_integration,
        get_bot_for_user,
        get_public_bot_config,
        get_user_for_session,
        list_bots_for_user,
        logout_session,
        query_bot_for_user,
        query_public_bot,
        render_widget_html,
        update_bot_for_user,
        update_bot_theme_for_user,
        upload_documents_for_bot,
    )
except ImportError:
    from rag import (
        authenticate_google_credential,
        build_bot_vector_db,
        create_bot_for_user,
        create_dev_session,
        generate_bot_integration,
        get_bot_for_user,
        get_public_bot_config,
        get_user_for_session,
        list_bots_for_user,
        logout_session,
        query_bot_for_user,
        query_public_bot,
        render_widget_html,
        update_bot_for_user,
        update_bot_theme_for_user,
        upload_documents_for_bot,
    )


app = FastAPI(title="RAG Bot SaaS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": str(exc), "traceback": traceback.format_exc()},
    )


class GoogleAuthRequest(BaseModel):
    credential: str


class DevLoginRequest(BaseModel):
    email: str
    name: str | None = None


class CreateBotRequest(BaseModel):
    name: str
    description: str = ""


class UpdateBotRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    public_enabled: bool | None = None


class ThemeUpdateRequest(BaseModel):
    botTitle: str | None = None
    welcomeMessage: str | None = None
    placeholder: str | None = None
    primaryColor: str | None = None
    accentColor: str | None = None
    surfaceColor: str | None = None
    textColor: str | None = None


class ChatRequest(BaseModel):
    question: str


def _base_url(request: Request) -> str:
    public_base = os.getenv("APP_PUBLIC_BASE_URL")
    if public_base:
        return public_base.rstrip("/")
    return str(request.base_url).rstrip("/")


def _http_error_from_exception(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, PermissionError):
        return HTTPException(status_code=403, detail=str(exc))
    if isinstance(exc, FileNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    return HTTPException(status_code=500, detail=str(exc))


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing Bearer token.")

    try:
        return get_user_for_session(token)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/")
def read_root():
    return {
        "message": "RAG Bot SaaS API is running.",
        "google_auth_enabled": bool(os.getenv("GOOGLE_CLIENT_ID")),
        "dev_auth_enabled": os.getenv("ALLOW_DEV_AUTH", "").lower() == "true",
    }


@app.get("/api/auth/config")
def auth_config():
    return {
        "google_auth_enabled": bool(os.getenv("GOOGLE_CLIENT_ID")),
        "google_client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "dev_auth_enabled": os.getenv("ALLOW_DEV_AUTH", "").lower() == "true",
    }


@app.post("/api/auth/google")
def google_auth(payload: GoogleAuthRequest):
    try:
        return authenticate_google_credential(payload.credential)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.post("/api/auth/dev-login")
def dev_login(payload: DevLoginRequest):
    try:
        return create_dev_session(payload.email, payload.name)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/api/user")
def auth_me(current_user=Depends(get_current_user)):
    return current_user


@app.post("/api/auth/logout")
def auth_logout(
    current_user=Depends(get_current_user),
    authorization: Annotated[str | None, Header()] = None,
):
    token = (authorization or "").removeprefix("Bearer ").strip()
    logout_session(token)
    return {"message": "Logged out."}


@app.get("/api/bots")
def list_bots(current_user=Depends(get_current_user)):
    try:
        return {"bots": list_bots_for_user(current_user["id"])}
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.post("/api/bots")
def create_bot(payload: CreateBotRequest, current_user=Depends(get_current_user)):
    try:
        return create_bot_for_user(
            current_user["id"], payload.name, payload.description
        )
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/api/bots/{bot_id}")
def get_bot(bot_id: str, current_user=Depends(get_current_user)):
    try:
        return get_bot_for_user(current_user["id"], bot_id)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.patch("/api/bots/{bot_id}")
def update_bot(
    bot_id: str, payload: UpdateBotRequest, current_user=Depends(get_current_user)
):
    try:
        return update_bot_for_user(
            current_user["id"],
            bot_id,
            name=payload.name,
            description=payload.description,
            public_enabled=payload.public_enabled,
        )
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.patch("/api/bots/{bot_id}/theme")
def update_bot_theme(
    bot_id: str, payload: ThemeUpdateRequest, current_user=Depends(get_current_user)
):
    try:
        return update_bot_theme_for_user(
            current_user["id"], bot_id, payload.model_dump()
        )
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.post("/api/bots/{bot_id}/documents")
async def upload_documents(
    bot_id: str,
    files: list[UploadFile] = File(...),
    current_user=Depends(get_current_user),
):
    uploads = []
    try:
        for file in files:
            uploads.append((file.filename or "", await file.read(), file.content_type))
        return upload_documents_for_bot(current_user["id"], bot_id, uploads)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc
    finally:
        for file in files:
            await file.close()


@app.post("/api/bots/{bot_id}/rebuild")
def rebuild_bot(bot_id: str, current_user=Depends(get_current_user)):
    try:
        return {"message": build_bot_vector_db(current_user["id"], bot_id)}
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.post("/api/bots/{bot_id}/chat")
def chat_bot(bot_id: str, payload: ChatRequest, current_user=Depends(get_current_user)):
    try:
        return query_bot_for_user(current_user["id"], bot_id, payload.question)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/api/bots/{bot_id}/integration")
def bot_integration(
    bot_id: str, request: Request, current_user=Depends(get_current_user)
):
    try:
        return generate_bot_integration(current_user["id"], bot_id, _base_url(request))
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/api/public/bots/{bot_id}/config")
def public_bot_config(bot_id: str):
    try:
        return get_public_bot_config(bot_id)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.post("/api/public/bots/{bot_id}/chat")
def public_bot_chat(bot_id: str, payload: ChatRequest):
    try:
        return query_public_bot(bot_id, payload.question)
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc


@app.get("/embed/{bot_id}", response_class=HTMLResponse)
def embedded_widget(bot_id: str, request: Request):
    try:
        return render_widget_html(bot_id, _base_url(request))
    except Exception as exc:
        raise _http_error_from_exception(exc) from exc
