from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import MonitoringSession, Alert, ViolationLog
from .serializers import (
    MonitoringSessionSerializer,
    AlertSerializer,
    ViolationLogSerializer
)
from hardware.offline_monitoring.models import OfflineExam


# ─── MonitoringSession ────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_monitoring(request, exam_id):
    try:
        exam = OfflineExam.objects.get(pk=exam_id)
    except OfflineExam.DoesNotExist:
        return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

    # لو في session شغالة بالفعل
    if MonitoringSession.objects.filter(exam=exam, status='running').exists():
        return Response({'error': 'Monitoring already running'}, status=status.HTTP_400_BAD_REQUEST)

    session = MonitoringSession.objects.create(exam=exam)

    # غير status الامتحان لـ active
    exam.status = 'active'
    exam.save()

    serializer = MonitoringSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_monitoring(request, session_id):
    try:
        session = MonitoringSession.objects.get(pk=session_id)
    except MonitoringSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    session.status   = 'ended'
    session.ended_at = timezone.now()
    session.save()

    # غير status الامتحان لـ completed
    session.exam.status = 'completed'
    session.exam.save()

    serializer = MonitoringSessionSerializer(session)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session(request, exam_id):
    try:
        session = MonitoringSession.objects.get(exam_id=exam_id)
    except MonitoringSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = MonitoringSessionSerializer(session)
    return Response(serializer.data)


# ─── Alerts ───────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def alert_list(request, session_id):
    try:
        session = MonitoringSession.objects.get(pk=session_id)
    except MonitoringSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        alerts = Alert.objects.filter(session=session)
        serializer = AlertSerializer(alerts, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = AlertSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(session=session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def review_alert(request, pk):
    try:
        alert = Alert.objects.get(pk=pk)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    alert.is_reviewed = True
    alert.save()
    return Response({'message': 'Alert marked as reviewed'})


# ─── ViolationLog ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def violation_log_list(request, session_id):
    try:
        session = MonitoringSession.objects.get(pk=session_id)
    except MonitoringSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    violations = ViolationLog.objects.filter(session=session)
    serializer = ViolationLogSerializer(violations, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_violation_report(request, session_id):
    """بيعمل ViolationLog لكل طالب بعد الامتحان"""
    try:
        session = MonitoringSession.objects.get(pk=session_id)
    except MonitoringSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    alerts = Alert.objects.filter(session=session)

    zone_data = {}
    for alert in alerts:
        zone = alert.zone
        if zone.id not in zone_data:
            zone_data[zone.id] = {'zone': zone, 'high': 0, 'medium': 0, 'low': 0, 'total': 0}
        zone_data[zone.id][alert.severity] += 1
        zone_data[zone.id]['total'] += 1

    for zid, data in zone_data.items():
        score = (data['high'] * 3) + (data['medium'] * 2) + (data['low'] * 1)
        ViolationLog.objects.update_or_create(
            zone=data['zone'],
            session=session,
            defaults={
                'total_alerts':    data['total'],
                'high_severity':   data['high'],
                'medium_severity': data['medium'],
                'low_severity':    data['low'],
                'violation_score': score,
            }
        )

    return Response({'message': 'Violation report generated successfully'})