# Generated by Django 5.1.6 on 2025-03-02 06:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='stockalert',
            name='resolved',
            field=models.BooleanField(default=False),
        ),
    ]
