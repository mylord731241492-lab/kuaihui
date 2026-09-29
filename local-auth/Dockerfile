ARG NODE_IMAGE=node:24-bookworm-slim
FROM ${NODE_IMAGE}
ENV NODE_ENV=production JUHE_BIND_HOST=0.0.0.0 JUHE_DATA_DIR=/data JUHE_LOGO_FILE=/app/logo.png
WORKDIR /app
COPY local-auth/package.json local-auth/*.mjs ./
COPY local-auth/public ./public
COPY app-asar/dist/assets/juhe-logo-mark.png ./logo.png
# Archives extracted with a restrictive umask may contain root-only source files.
# Runtime code stays root-owned; grant the unprivileged node user read/traverse access.
RUN chmod -R a+rX /app && mkdir /data && chown node:node /data
USER node
EXPOSE 47831
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:47831/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
