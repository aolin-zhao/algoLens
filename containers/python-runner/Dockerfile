FROM python:3.12-slim
RUN groupadd -g 10001 runner && useradd -u 10001 -g runner -m runner
WORKDIR /app
COPY server.py /app/server.py
USER runner
EXPOSE 8080
CMD ["python", "-I", "/app/server.py"]
