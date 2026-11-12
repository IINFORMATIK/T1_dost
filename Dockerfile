FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node dist/ ./dist/
COPY --chown=node:node scripts/catalog-server.mjs ./scripts/catalog-server.mjs
ENV HOST=0.0.0.0 PORT=8080 CATALOG_DATA_DIR=/data
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "scripts/catalog-server.mjs"]
