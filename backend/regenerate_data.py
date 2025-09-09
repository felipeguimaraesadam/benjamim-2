#!/usr/bin/env python
import os
import sys
import django
import json
from django.core import serializers
from django.apps import apps

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
django.setup()

def regenerate_data_json():
    """Regenerate data.json with proper UTF-8 encoding"""
    try:
        # Get all data excluding system tables
        data = []
        
        # Get all models from the core app
        for model in apps.get_models():
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            
            # Skip system tables
            if app_label in ['contenttypes', 'admin', 'sessions']:
                continue
            if app_label == 'auth' and model_name in ['permission', 'logentry']:
                continue
                
            # Serialize model data
            try:
                queryset = model.objects.all()
                if queryset.exists():
                    serialized = serializers.serialize('json', queryset)
                    model_data = json.loads(serialized)
                    data.extend(model_data)
                    print(f"Exported {len(model_data)} records from {app_label}.{model_name}")
            except Exception as e:
                print(f"Error serializing {app_label}.{model_name}: {e}")
                continue
        
        # Write to file with UTF-8 encoding
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully regenerated data.json with {len(data)} records")
        return True
        
    except Exception as e:
        print(f"Error regenerating data.json: {e}")
        return False

if __name__ == '__main__':
    success = regenerate_data_json()
    sys.exit(0 if success else 1)