FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Fix potential Windows CRLF line endings
RUN sed -i 's/\r$//' startup.sh && chmod +x startup.sh

CMD ["./startup.sh"]
