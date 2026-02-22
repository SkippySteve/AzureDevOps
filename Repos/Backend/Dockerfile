FROM python:3.13-slim-bookworm AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
# Install GCC only in the builder
RUN apt-get update && apt-get install -y build-essential

COPY requirements.txt .
# Install into a local folder we can copy later
RUN uv pip install --no-cache -r requirements.txt --target /app/pkgs

# Runner
FROM python:3.13-slim-bookworm
WORKDIR /app

COPY --from=builder /app/pkgs /usr/local/lib/python3.13/site-packages
COPY ./app ./app

ENV PATH="/usr/local/lib/python3.13/site-packages/bin:$PATH"
ENV PYTHONPATH=/usr/local/lib/python3.13/site-packages

EXPOSE 8000

CMD ["python", "-m", "fastapi", "run", "app/main.py", "--port", "8000"]