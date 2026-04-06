FROM python:3.11-slim
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml .
RUN pip install -e .
COPY . .
CMD ["python", "main.py"]
