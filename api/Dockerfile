# Container for the API. Build context is this folder:
#   cd api && docker build -t embassy-api . && docker run --rm -p 8080:8080 embassy-api
# Cloud Run builds the same image from the repository (source location: /api) and sets PORT=8080.

FROM python:3.13-slim

# Never run as root inside the container
RUN useradd --create-home --uid 1000 app
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY advisories.py main.py ./
COPY data/ ./data/

USER app
ENV PORT=8080 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
