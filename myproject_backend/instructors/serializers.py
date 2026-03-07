from rest_framework import serializers
from .models import Class

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = [
            'id',
            'name',
            'description',
            'number_of_students',
            'code',
            'created_at',
        ]
        read_only_fields = ['code', 'created_at']