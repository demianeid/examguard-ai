from django.contrib import admin
from .models import Exam, Question, Choice, StudentAnswer, ExamResult, ExamSession


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'professor', 'status', 'start_datetime', 'end_datetime', 'duration', 'total_marks')
    filter_horizontal = ('assigned_students',)
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'professor__last_name')
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'exam', 'question_type', 'marks', 'order')
    list_filter = ('question_type',)
    search_fields = ('question_text', 'exam__title')
    inlines = [ChoiceInline]


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('choice_text', 'question', 'is_correct')
    list_filter = ('is_correct',)


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'question', 'selected_choice', 'is_correct', 'marks_obtained', 'answered_at')
    list_filter = ('is_correct', 'exam')
    search_fields = ('student__email', 'exam__title')


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'total_marks_obtained', 'total_marks', 'percentage', 'submitted_at', 'is_terminated')
    list_filter = ('is_terminated', 'submitted_at')
    search_fields = ('student__email', 'exam__title')


# NEW
@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display  = ('student', 'exam', 'started_at', 'ip_address', 'system_check_passed', 'is_active')
    list_filter   = ('system_check_passed', 'is_active', 'started_at')
    search_fields = ('student__email', 'exam__title', 'ip_address')
    readonly_fields = ('started_at', 'ip_address', 'user_agent')