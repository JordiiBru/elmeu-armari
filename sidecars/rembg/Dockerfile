# Background removal sidecar for elmeu-armari. See server.py for why this
# is not the stock rembg image.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    REMBG_HOME=/models \
    NUMBA_CACHE_DIR=/tmp/numba

# Pinned: rembg 2.0.84 is MIT, and the only model this image carries is
# U2-Net (Apache-2.0). Nothing non-commercial is on the disk to be loaded
# by mistake.
RUN pip install "rembg[cpu]==2.0.84" "fastapi==0.128.8" "uvicorn==0.40.0" "python-multipart==0.0.21"

# Weights baked in at build time so a pod never downloads them on start.
RUN python -c "from rembg import new_session; new_session('u2net')" \
    && chmod -R a+rX /models

WORKDIR /app
COPY server.py .

USER 65534:65534
EXPOSE 7000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7000"]
