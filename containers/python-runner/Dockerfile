FROM node:22-bookworm-slim AS node
RUN npm install --global typescript@5.8.3 @types/node@22.15.0

FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-jdk-headless gcc g++ libc6-dev golang-go rustc \
    && rm -rf /var/lib/apt/lists/*
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/typescript /usr/local/lib/node_modules/typescript
COPY --from=node /usr/local/lib/node_modules/@types /usr/local/lib/node_modules/@types
RUN ln -s /usr/local/lib/node_modules/typescript/bin/tsc /usr/local/bin/tsc
ENV NODE_TYPE_ROOTS=/usr/local/lib/node_modules/@types
RUN groupadd -g 10001 runner && useradd -u 10001 -g runner -m runner
WORKDIR /app
COPY server.py /app/server.py
COPY runtime.py /app/runtime.py
USER runner
EXPOSE 8080
CMD ["python", "-I", "/app/server.py"]
