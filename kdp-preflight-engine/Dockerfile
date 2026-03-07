# KDP Preflight Engine — API + Celery worker (single container for Render)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY pyproject.toml ./
RUN mkdir -p /app/data/uploads

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Run API and worker in same container. Use PORT from Render (e.g. 10000) or default 8000.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} & celery -A app.tasks.validate_pdf worker -l info --concurrency=2 & wait"]
