# Container for the API. Built from the REPOSITORY ROOT so it can include the site's alerts.json:
#   docker build -f api/Dockerfile -t embassy-api .
#   docker run --rm -p 8080:8080 embassy-api
# Cloud Run runs the same image and sets PORT=8080.

FROM python:3.13-slim

# Never run as root inside the container
RUN useradd --create-home --uid 1000 app
WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/advisories.py api/main.py ./
COPY site/src/data/alerts.json ./data/alerts.json

USER app
ENV PORT=8080 PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
