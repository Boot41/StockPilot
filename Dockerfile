# Stage 1: Build Frontend
FROM node:20-slim as frontend-build

# Set working directory
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Stage 2: Build and run backend with frontend static files
FROM python:3.12-slim as production

# Set build arguments for sensitive data (to be provided during build)
ARG DJANGO_SUPERUSER_PASSWORD
ARG SECRET_KEY
ARG GEMINI_API_KEY
ARG EMAIL_HOST_PASSWORD

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DJANGO_SETTINGS_MODULE=ai_inventory_backend.production \
    DEBUG=0 \
    # Application specific environment variables
    DJANGO_SUPERUSER_USERNAME=stockpilot \
    DJANGO_SUPERUSER_EMAIL=stockpilot@gmail.com \
    DJANGO_SUPERUSER_PASSWORD=${DJANGO_SUPERUSER_PASSWORD} \
    SECRET_KEY=${SECRET_KEY} \
    GEMINI_API_KEY=${GEMINI_API_KEY} \
    EMAIL_HOST_USER=karan.singhrawat@think41.com \
    EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD} \
    DB_NAME=db.sqlite3

# Create non-root user
RUN groupadd -r stockpilot && useradd -r -g stockpilot stockpilot

# Install system dependencies and clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    python-dotenv \
    django-extensions \
    requests \
    numpy \
    pandas \
    scikit-learn \
    google-generativeai \
    whitenoise \
    gunicorn

# Create necessary directories
RUN mkdir -p /app/static /app/staticfiles /app/media /app/data /app/templates \
    && chown -R stockpilot:stockpilot /app

# Copy backend code
COPY --chown=stockpilot:stockpilot backend/ .

# Copy frontend build from previous stage
COPY --from=frontend-build --chown=stockpilot:stockpilot /app/frontend/dist /app/static/
COPY --from=frontend-build --chown=stockpilot:stockpilot /app/frontend/dist/assets /app/static/assets/
COPY --from=frontend-build --chown=stockpilot:stockpilot /app/frontend/dist/index.html /app/templates/index.html

# Collect static files
RUN python manage.py collectstatic --noinput

# Copy and set permissions for entrypoint script
COPY --chown=stockpilot:stockpilot entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Switch to non-root user
USER stockpilot

# Expose port
EXPOSE 8000

# Set entrypoint and default command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "-b", "0.0.0.0:8000", "ai_inventory_backend.wsgi:application", "--workers", "4", "--threads", "2", "--timeout", "120", "--access-logfile", "-", "--error-logfile", "-"]
