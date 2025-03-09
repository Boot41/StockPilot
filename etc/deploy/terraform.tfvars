# Google Cloud Project Configuration
project_id = "boot41"
region     = "asia-south1"

# Container Deployment Configuration
service_name    = "stockpilot"
container_image = "asia-south1-docker.pkg.dev/boot41/a3/stockpilot"
container_tag   = "latest"

# Environment Variables (Optional)
environment_variables = {
  "DEBUG"                     = "false"
  "LOG_LEVEL"                 = "info"
  "DB_NAME"                   = "sample.sqlite3"
  "SECRET_KEY"                = "your-secret-key-here"
  "DJANGO_SUPERUSER_PASSWORD" = "admin123"
  "DJANGO_SETTINGS_MODULE"    = "ai_inventory_backend.settings"
}
