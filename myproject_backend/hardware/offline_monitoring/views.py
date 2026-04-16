from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ExamHall, Camera, OfflineExam, StudentZone, HallEnrollment
from .serializers import (
    ExamHallSerializer,
    CameraSerializer,
    OfflineExamSerializer,
    StudentZoneSerializer,
    HallEnrollmentSerializer
)

User = get_user_model()


# ─── ExamHall ─────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def exam_hall_list(request):
    if request.method == 'GET':
        halls = ExamHall.objects.filter(is_active=True)
        serializer = ExamHallSerializer(halls, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ExamHallSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def exam_hall_detail(request, pk):
    try:
        hall = ExamHall.objects.get(pk=pk)
    except ExamHall.DoesNotExist:
        return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ExamHallSerializer(hall)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ExamHallSerializer(hall, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        hall.is_active = False
        hall.save()
        return Response({'message': 'Hall deactivated'}, status=status.HTTP_200_OK)


# ─── Camera ───────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def camera_list(request, hall_id):
    try:
        hall = ExamHall.objects.get(pk=hall_id)
    except ExamHall.DoesNotExist:
        return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        cameras = Camera.objects.filter(hall=hall)
        serializer = CameraSerializer(cameras, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = CameraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hall=hall)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def camera_detail(request, pk):
    try:
        camera = Camera.objects.get(pk=pk)
    except Camera.DoesNotExist:
        return Response({'error': 'Camera not found'}, status=status.HTTP_404_NOT_FOUND)

    camera.delete()
    return Response({'message': 'Camera deleted'}, status=status.HTTP_200_OK)


# ─── OfflineExam ──────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def offline_exam_list(request):
    if request.method == 'GET':
        if request.user.is_superuser:
            exams = OfflineExam.objects.all()
        else:
            exams = OfflineExam.objects.filter(professor=request.user)
        serializer = OfflineExamSerializer(exams, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = OfflineExamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(professor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def offline_exam_detail(request, pk):
    try:
        if request.user.is_superuser:
            exam = OfflineExam.objects.get(pk=pk)
        else:
            exam = OfflineExam.objects.get(pk=pk, professor=request.user)
    except OfflineExam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = OfflineExamSerializer(exam)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = OfflineExamSerializer(exam, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        exam.delete()
        return Response({'message': 'Exam deleted'}, status=status.HTTP_200_OK)


# ─── StudentZone ──────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def student_zone_list(request, hall_id):
    try:
        hall = ExamHall.objects.get(pk=hall_id)
    except ExamHall.DoesNotExist:
        return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        zones = StudentZone.objects.filter(hall=hall)
        serializer = StudentZoneSerializer(zones, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        camera_id = request.data.get('camera')
        if not Camera.objects.filter(pk=camera_id, hall=hall).exists():
            return Response(
                {'error': 'Camera does not belong to this hall'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = StudentZoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hall=hall)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def student_zone_detail(request, pk):
    try:
        zone = StudentZone.objects.get(pk=pk)
    except StudentZone.DoesNotExist:
        return Response({'error': 'Zone not found'}, status=status.HTTP_404_NOT_FOUND)

    zone.delete()
    return Response({'message': 'Zone deleted'}, status=status.HTTP_200_OK)


# ─── HallEnrollment ───────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def hall_enrollment_list(request, hall_id):
    try:
        hall = ExamHall.objects.get(pk=hall_id)
    except ExamHall.DoesNotExist:
        return Response({'error': 'Hall not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        enrollments = HallEnrollment.objects.filter(hall=hall)
        serializer  = HallEnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = HallEnrollmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hall=hall)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def hall_enrollment_detail(request, pk):
    try:
        enrollment = HallEnrollment.objects.get(pk=pk)
    except HallEnrollment.DoesNotExist:
        return Response({'error': 'Enrollment not found'}, status=status.HTTP_404_NOT_FOUND)

    enrollment.delete()
    return Response({'message': 'Student removed from hall'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_list_view(request):
    students = User.objects.filter(role='student').values('id', 'first_name', 'last_name', 'email')
    data = [
        {
            'id': s['id'],
            'name': f"{s['first_name']} {s['last_name']}".strip() or s['email'],
            'email': s['email'],
        }
        for s in students
    ]
    return Response(data)