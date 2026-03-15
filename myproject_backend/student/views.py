from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from instructors.models import Class, ClassEnrollment
from exam.models import Exam, StudentAnswer, ExamResult, Choice


# --- Get all classes the student is enrolled in ---
class StudentClassesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = ClassEnrollment.objects.filter(
            student=request.user
        ).select_related('class_enrolled', 'class_enrolled__instructor')

        classes_data = []
        for enrollment in enrollments:
            cls = enrollment.class_enrolled
            upcoming_count = Exam.objects.filter(class_id=cls, status='upcoming').count()
            classes_data.append({
                'id': cls.id,
                'name': cls.name,
                'description': cls.description,
                'code': cls.code,
                'subject': getattr(cls, 'subject', ''),
                'instructor': cls.instructor.get_full_name(),
                'number_of_students': cls.enrollments.count(),
                'upcoming_exams': upcoming_count,
                'progress': 0,
                'last_activity': cls.created_at,
                'created_at': cls.created_at,
            })

        return Response(classes_data)


# --- Join a class using its code ---
class JoinClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').upper().strip()

        if not code:
            return Response(
                {'detail': 'Class code is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            cls = Class.objects.get(code=code)
        except Class.DoesNotExist:
            return Response(
                {'detail': 'Class not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if ClassEnrollment.objects.filter(student=request.user, class_enrolled=cls).exists():
            return Response(
                {'detail': 'Already enrolled in this class.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ClassEnrollment.objects.create(student=request.user, class_enrolled=cls)

        return Response({
            'detail': 'Joined successfully!',
            'class_id': cls.id,
            'class_name': cls.name,
            'class_code': cls.code,
            'instructor': cls.instructor.get_full_name(),
        }, status=status.HTTP_201_CREATED)


# --- Leave a class ---
class LeaveClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, class_id):
        try:
            enrollment = ClassEnrollment.objects.get(
                student=request.user,
                class_enrolled__id=class_id
            )
        except ClassEnrollment.DoesNotExist:
            return Response(
                {'detail': 'You are not enrolled in this class.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrollment.delete()
        return Response({'detail': 'Left class successfully.'}, status=status.HTTP_200_OK)


# --- Get all exams for a specific class ---
class StudentClassExamsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, class_id):
        enrolled = ClassEnrollment.objects.filter(
            student=request.user,
            class_enrolled__id=class_id
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Not enrolled in this class.'},
                status=status.HTTP_403_FORBIDDEN
            )

        exams = Exam.objects.filter(class_id=class_id).values(
            'id', 'title', 'description', 'duration',
            'total_marks', 'start_datetime', 'end_datetime', 'status'
        )

        return Response(list(exams))


# --- Get exam questions for a specific exam (without correct answers) ---
class StudentExamDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'detail': 'Exam not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrolled = ClassEnrollment.objects.filter(
            student=request.user,
            class_enrolled=exam.class_id
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Not enrolled in this class.'},
                status=status.HTTP_403_FORBIDDEN
            )

        questions = []
        for q in exam.questions.all().order_by('order'):
            choices = []
            if q.question_type != 'essay':
                choices = [
                    {'id': c.id, 'choice_text': c.choice_text}
                    for c in q.choices.all()
                ]
            questions.append({
                'id': q.id,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'marks': q.marks,
                'order': q.order,
                'choices': choices,
            })

        return Response({
            'id': exam.id,
            'title': exam.title,
            'duration': exam.duration,
            'total_marks': exam.total_marks,
            'instructions': exam.instructions,
            'questions': questions,
        })


# --- Submit exam answers and calculate grade ---
class StudentExamSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response(
                {'detail': 'Exam not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrolled = ClassEnrollment.objects.filter(
            student=request.user,
            class_enrolled=exam.class_id
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Not enrolled in this class.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if ExamResult.objects.filter(student=request.user, exam=exam).exists():
            return Response(
                {'detail': 'Exam already submitted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        answers_data = request.data.get('answers', [])
        is_terminated = request.data.get('is_terminated', False)
        violation_score = request.data.get('violation_score', 0)

        total_marks_obtained = 0

        for answer in answers_data:
            question_id = answer.get('question_id')
            choice_id = answer.get('choice_id')
            essay_text = answer.get('essay_answer', '')

            try:
                question = exam.questions.get(id=question_id)
            except Exception:
                continue

            is_correct = None
            marks_obtained = 0
            selected_choice = None

            if question.question_type in ['multiple_choice', 'true_false'] and choice_id:
                try:
                    selected_choice = Choice.objects.get(id=choice_id, question=question)
                    is_correct = selected_choice.is_correct
                    if is_correct:
                        marks_obtained = question.marks
                        total_marks_obtained += marks_obtained
                except Exception:
                    pass

            StudentAnswer.objects.create(
                student=request.user,
                exam=exam,
                question=question,
                selected_choice=selected_choice,
                essay_answer=essay_text if question.question_type == 'essay' else None,
                is_correct=is_correct,
                marks_obtained=marks_obtained,
            )

        percentage = (total_marks_obtained / exam.total_marks * 100) if exam.total_marks > 0 else 0

        ExamResult.objects.create(
            student=request.user,
            exam=exam,
            total_marks_obtained=total_marks_obtained,
            total_marks=exam.total_marks,
            percentage=round(percentage, 2),
            is_terminated=is_terminated,
            violation_score=violation_score,
        )

        return Response({
            'detail': 'Exam submitted successfully.',
            'total_marks_obtained': total_marks_obtained,
            'total_marks': exam.total_marks,
            'percentage': round(percentage, 2),
        }, status=status.HTTP_201_CREATED)


# --- Get exam result for a specific student ---
class StudentExamResultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exam_id):
        try:
            result = ExamResult.objects.get(student=request.user, exam__id=exam_id)
        except ExamResult.DoesNotExist:
            return Response(
                {'detail': 'No result found for this exam.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'exam_id': result.exam.id,
            'exam_title': result.exam.title,
            'total_marks_obtained': result.total_marks_obtained,
            'total_marks': result.total_marks,
            'percentage': result.percentage,
            'submitted_at': result.submitted_at,
            'is_terminated': result.is_terminated,
            'violation_score': result.violation_score,
        })


# --- Get all exam results for a student in a specific class ---
class StudentClassGradesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, class_id):
        enrolled = ClassEnrollment.objects.filter(
            student=request.user,
            class_enrolled__id=class_id
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Not enrolled in this class.'},
                status=status.HTTP_403_FORBIDDEN
            )

        results = ExamResult.objects.filter(
            student=request.user,
            exam__class_id__id=class_id
        ).select_related('exam')

        data = []
        for r in results:
            data.append({
                'exam_id': r.exam.id,
                'exam_title': r.exam.title,
                'total_marks_obtained': r.total_marks_obtained,
                'total_marks': r.total_marks,
                'percentage': r.percentage,
                'submitted_at': r.submitted_at,
                'is_terminated': r.is_terminated,
            })

        return Response(data)