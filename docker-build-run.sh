#!/bin/bash

# Exit on any error
set -e

# Function to show usage
show_usage() {
    echo "Usage: $0 [--env-file <path>] [--build-only] [--run-only]"
    echo ""
    echo "Options:"
    echo "  --env-file <path>  Path to environment file (default: .env)"
    echo "  --build-only       Only build the Docker image"
    echo "  --run-only         Only run the Docker container"
    echo ""
    exit 1
}

# Default values
ENV_FILE=".env"
BUILD_ONLY=0
RUN_ONLY=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --build-only)
            BUILD_ONLY=1
            shift
            ;;
        --run-only)
            RUN_ONLY=1
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file '$ENV_FILE' not found!"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Build the Docker image if not run-only
if [ $RUN_ONLY -eq 0 ]; then
    echo "Building Docker image..."
    docker build \
        --build-arg DJANGO_SUPERUSER_PASSWORD="${DJANGO_SUPERUSER_PASSWORD}" \
        --build-arg SECRET_KEY="${SECRET_KEY}" \
        --build-arg GEMINI_API_KEY="${GEMINI_API_KEY}" \
        --build-arg EMAIL_HOST_PASSWORD="${EMAIL_HOST_PASSWORD}" \
        -t stockpilot:latest .
fi

# Run the container if not build-only
if [ $BUILD_ONLY -eq 0 ]; then
    echo "Running Docker container..."
    docker run -d \
        --name stockpilot \
        -p 8080:8000 \
        --restart unless-stopped \
        stockpilot:latest

    echo "Container started! The application should be available at http://localhost:8000"
    echo "To view logs: docker logs -f stockpilot"
    echo "To stop: docker stop stockpilot"
    echo "To remove: docker rm stockpilot"
fi
