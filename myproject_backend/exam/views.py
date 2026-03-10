from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from .models import Exam
from .serializers import ExamSerializer, ExamListSerializer
from authentication.models import Professor
from instructors.models import Class


# ============================================================
# HELPER - Extract professor from token
# ============================================================
def get_professor_from_token(request):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None

    token_str = auth_header.split(' ')[1]
    try:
        token = AccessToken(token_str)
        if 'professor_id' not in token:
            return None
        professor = Professor.objects.get(professor_custom_id=token['professor_id'])
        return professor
    except Exception:
        return None


# ============================================================
# CREATE EXAM & LIST EXAMS (per class)
# ============================================================
class ExamListCreateView(APIView):

    def get(self, request, class_id):
        professor = get_professor_from_token(request)
        if not professor:
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_401_UNAUTHORIZED)

        exams = Exam.objects.filter(professor=professor, class_id=class_id)
        serializer = ExamListSerializer(exams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, class_id):
        professor = get_professor_from_token(request)
        if not professor:
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
           class_obj = Class.objects.get(id=class_id, instructor=professor)
        except Class.DoesNotExist:
            return Response({"error": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(professor=professor, class_id=class_obj)
            return Response({
                "message": "Exam created successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# GET, UPDATE, DELETE SINGLE EXAM
# ============================================================
class ExamDetailView(APIView):

    def get_exam(self, exam_id, professor):
        try:
            return Exam.objects.get(id=exam_id, professor=professor)
        except Exam.DoesNotExist:
            return None

    def get(self, request, exam_id):
        professor = get_professor_from_token(request)
        if not professor:
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_401_UNAUTHORIZED)

        exam = self.get_exam(exam_id, professor)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(exam)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, exam_id):
        professor = get_professor_from_token(request)
        if not professor:
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_401_UNAUTHORIZED)

        exam = self.get_exam(exam_id, professor)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(exam, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Exam updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, exam_id):
        professor = get_professor_from_token(request)
        if not professor:
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_401_UNAUTHORIZED)

        exam = self.get_exam(exam_id, professor)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        exam.delete()
        return Response({"message": "Exam deleted successfully."}, status=status.HTTP_200_OK)