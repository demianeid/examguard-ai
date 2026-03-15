from rest_framework import serializers
from .models import Class

class ClassSerializer(serializers.ModelSerializer):
    instructor = serializers.SerializerMethodField()
    number_of_students = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            'id',
            'name',
            'description',
            'subject',
            'number_of_students',
            'code',
            'instructor',
            'created_at',
        ]
        read_only_fields = ['code', 'created_at']

    def get_instructor(self, obj):
        return obj.instructor.get_full_name()

    def get_number_of_students(self, obj):
        return obj.enrollments.count()