#!/bin/bash

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Load fixtures if they exist
if [ -d fixtures ]; then
    echo "Loading fixtures..."
    for fixture in fixtures/*.json; do
        if [ -f "$fixture" ]; then
            python manage.py loaddata $fixture
        fi
    done
fi

# Create superuser if not exists
if [ "$DJANGO_SUPERUSER_USERNAME" ] && [ "$DJANGO_SUPERUSER_PASSWORD" ] && [ "$DJANGO_SUPERUSER_EMAIL" ]; then
    echo "Checking if superuser exists..."
    python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exists = User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists(); print('EXISTS' if exists else 'NOT_EXISTS')"
    if [[ $? -eq 0 ]]; then
        if [[ $(python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); exists = User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists(); print('EXISTS' if exists else 'NOT_EXISTS')") == 'NOT_EXISTS' ]]; then
            echo "Creating superuser..."
            python manage.py createsuperuser --noinput
        else
            echo "Superuser already exists."
        fi
    fi
fi

# Start command
exec "$@"
