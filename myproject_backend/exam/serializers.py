from rest_framework import serializers
from .models import Exam, Question, Choice
from django.utils import timezone

# ============================================================
# CHOICE
# ============================================================
class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']


# ============================================================
# QUESTION
# ============================================================
class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'marks', 'order', 'choices']

    def validate(self, data):
        question_type = data.get('question_type')
        choices = data.get('choices', [])

        if question_type == 'essay':
            return data

        if not choices:
            raise serializers.ValidationError("Multiple choice and True/False questions require choices.")

        correct_choices = [c for c in choices if c.get('is_correct')]
        if not correct_choices:
            raise serializers.ValidationError("At least one correct answer is required.")

        if question_type == 'true_false' and len(choices) != 2:
            raise serializers.ValidationError("True/False questions must have exactly 2 choices.")

        return data


# ============================================================
# EXAM - CREATE / UPDATE
# ============================================================
class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'duration', 'total_marks',
            'start_datetime', 'end_datetime', 'instructions',
            'status', 'created_at', 'questions'
        ]
        read_only_fields = ['id', 'created_at', 'status']

    def validate(self, data):
        now = timezone.now()
        start = data.get('start_datetime')
        end = data.get('end_datetime')
        if start and start < now - timezone.timedelta(minutes=1):
            raise serializers.ValidationError({"start_datetime": "Start datetime cannot be in the past."})
        if end and end < now - timezone.timedelta(minutes=1):
            raise serializers.ValidationError({"end_datetime": "End datetime cannot be in the past."})
        if start and end and end <= start:
            raise serializers.ValidationError({"end_datetime": "End datetime must be after start datetime."})

        questions = data.get('questions', [])
        total_marks = data.get('total_marks', 0)
        questions_total = sum(q.get('marks', 0) for q in questions)
        if questions and questions_total != total_marks:
            raise serializers.ValidationError({
                "total_marks": f"Questions total marks ({questions_total}) must equal total marks ({total_marks})."
            })

        return data

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        exam = Exam.objects.create(**validated_data)

        for i, question_data in enumerate(questions_data):
            choices_data = question_data.pop('choices', [])
            question_data['order'] = i + 1
            question = Question.objects.create(exam=exam, **question_data)

            if question.question_type != 'essay':
                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)

        return exam

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        instance.questions.all().delete()
        for i, question_data in enumerate(questions_data):
            choices_data = question_data.pop('choices', [])
            question_data['order'] = i + 1
            question = Question.objects.create(exam=instance, **question_data)

            if question.question_type != 'essay':
                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)

        return instance


# ============================================================
# EXAM LIST (lightweight - no questions)
# ============================================================
class ExamListSerializer(serializers.ModelSerializer):
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'duration', 'total_marks',
            'start_datetime', 'end_datetime', 'status', 'questions_count'
        ]