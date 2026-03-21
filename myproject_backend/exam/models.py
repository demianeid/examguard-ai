from django.db import models
from django.conf import settings
from instructors.models import Class


class Exam(models.Model):
    STATUS_CHOICES = [
        ('upcoming',  'Upcoming'),
        ('active',    'Active'),
        ('completed', 'Completed'),
    ]

    professor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exams',
        limit_choices_to={'role': 'PROFESSOR'}
    )
    class_id          = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='exams', null=True, blank=True)
    title             = models.CharField(max_length=255)
    description       = models.TextField(blank=True, null=True)
    duration          = models.PositiveIntegerField(help_text="Duration in minutes")
    total_marks       = models.PositiveIntegerField(default=100)
    start_datetime    = models.DateTimeField()
    end_datetime      = models.DateTimeField()
    instructions      = models.TextField(blank=True, null=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    assigned_students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='assigned_exams'
    )
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exams'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - Dr. {self.professor.last_name}"


class Question(models.Model):
    TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false',      'True / False'),
        ('essay',           'Essay'),
    ]

    exam          = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    marks         = models.PositiveIntegerField(default=1)
    order         = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'questions'
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}"


class Choice(models.Model):
    question    = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=255)
    is_correct  = models.BooleanField(default=False)

    class Meta:
        db_table = 'choices'

    def __str__(self):
        return f"{self.choice_text} ({'✓' if self.is_correct else '✗'})"


# --- Stores each student's answer for a specific question ---
class StudentAnswer(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='student_answers'
    )
    selected_choice = models.ForeignKey(
        Choice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_answers'
    )
    essay_answer   = models.TextField(blank=True, null=True)
    is_correct     = models.BooleanField(null=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    answered_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'exam', 'question']

    def __str__(self):
        return f"{self.student} - {self.exam.title} - Q{self.question.order}"


# --- Stores the final result for a student in an exam ---
class ExamResult(models.Model):
    student              = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_results'
    )
    exam                 = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='results'
    )
    total_marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_marks          = models.PositiveIntegerField(default=0)
    percentage           = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    submitted_at         = models.DateTimeField(auto_now_add=True)
    is_terminated        = models.BooleanField(default=False)
    violation_score      = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        unique_together = ['student', 'exam']

    def __str__(self):
        return f"{self.student} - {self.exam.title} - {self.percentage}%"


# --- NEW: Tracks when a student officially starts an exam ---
class ExamSession(models.Model):
    student             = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_sessions'
    )
    exam                = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    started_at          = models.DateTimeField(auto_now_add=True)
    ip_address          = models.GenericIPAddressField(null=True, blank=True)
    user_agent          = models.TextField(blank=True, null=True)
    system_check_passed = models.BooleanField(default=False)
    is_active           = models.BooleanField(default=True)

    class Meta:
        db_table = 'exam_sessions'
        # منع الطالب من فتح نفس الامتحان مرتين
        unique_together = ['student', 'exam']

    def __str__(self):
        return f"{self.student} - {self.exam.title} - {self.started_at}"