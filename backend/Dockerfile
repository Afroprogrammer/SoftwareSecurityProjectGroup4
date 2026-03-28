FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for cryptography and asyncpg
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure the uploads directory exists with correct permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads 

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
