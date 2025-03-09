# Build stage for frontend
FROM node:20-slim AS frontend-build
WORKDIR /frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Final stage
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn whitenoise

# Copy backend code and database
COPY backend/ .

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media /app/static /app/templates

# Copy frontend build from build stage
COPY --from=frontend-build /frontend/dist /app/static
COPY --from=frontend-build /frontend/dist/index.html /app/templates/index.html

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=ai_inventory_backend.settings \
    DB_NAME=db.sqlite3 \
    DEBUG=False

# Create startup script
RUN echo '#!/bin/bash\n\
\n\
python manage.py migrate\n\
\n\
# Create superuser only if it doesn'\''t exist\n\
echo "from django.contrib.auth.models import User; User.objects.get_or_create(username='\''stockpilot'\'', defaults={'\''is_superuser'\'': True, '\''is_staff'\'': True, '\''email'\'': '\''admin@example.com'\'', '\''password'\'': '\''admin123'\''})" | python manage.py shell\n\
\n\
python manage.py collectstatic --noinput\n\
\n\
gunicorn ai_inventory_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile - --error-logfile -' > /app/startup.sh \
    && chmod +x /app/startup.sh

# Set the entrypoint
ENTRYPOINT ["/app/startup.sh"]

# Expose port
EXPOSE 8000