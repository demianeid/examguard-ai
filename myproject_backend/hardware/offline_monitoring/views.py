from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ExamHall, Camera, OfflineExam, StudentZone
from .serializers import (
    ExamHallSerializer,
    CameraSerializer,
    OfflineExamSerializer,
    StudentZoneSerializer
)


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


# ─── OfflineExam ──────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def offline_exam_list(request):
    if request.method == 'GET':
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
def student_zone_list(request, exam_id):
    try:
        exam = OfflineExam.objects.get(pk=exam_id)
    except OfflineExam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        zones = StudentZone.objects.filter(exam=exam)
        serializer = StudentZoneSerializer(zones, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = StudentZoneSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(exam=exam)
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