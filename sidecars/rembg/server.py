"""Background removal for garment photos, as a tiny internal HTTP service.

The stock `rembg s` server would do, but its default model is `bria-rmbg`
(non-commercial licence), it fetches arbitrary URLs and it ships a web UI.
This is one route, one model (U2-Net, Apache-2.0), nothing else. It is meant
to be reached only from the app, inside the cluster.
"""
import threading

from fastapi import FastAPI, File, HTTPException, UploadFile
from rembg import new_session, remove
from starlette.responses import Response

# The app sends photos already resized to 800 px; anything much bigger than
# that is a mistake, and a 40 MB body should not be able to fill the memory.
MAX_BYTES = 12 * 1024 * 1024

# Loaded once, at start: the weights are baked into the image, so nothing is
# downloaded at runtime and readiness means the model is really there.
session = new_session("u2net")

# One inference at a time. The session is shared and the container's memory
# budget is sized for one; concurrent requests queue instead of doubling it.
lock = threading.Lock()

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True}


@app.post("/remove")
def remove_background(file: UploadFile = File(...)) -> Response:
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="image too large")
    try:
        with lock:
            cutout = remove(data, session=session, force_return_bytes=True)
    except Exception as e:  # an undecodable or unsupported image
        raise HTTPException(status_code=422, detail="could not process the image") from e
    return Response(content=cutout, media_type="image/png")
