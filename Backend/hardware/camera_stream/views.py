from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import StreamSession
from .serializers import StreamSessionSerializer
from hardware.offline_monitoring.models import Camera


# ─── StreamSession ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_stream(request, camera_id):
    try:
        camera = Camera.objects.get(pk=camera_id)
    except Camera.DoesNotExist:
        return Response({'error': 'Camera not found'}, status=status.HTTP_404_NOT_FOUND)

    # لو في stream شغال بالفعل
    if StreamSession.objects.filter(camera=camera, status='live').exists():
        return Response({'error': 'Stream already running'}, status=status.HTTP_400_BAD_REQUEST)

    session = StreamSession.objects.create(
        camera=camera,
        status='connecting'
    )

    # غير status الكاميرا
    camera.status = 'active'
    camera.save()

    serializer = StreamSessionSerializer(session)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stop_stream(request, session_id):
    try:
        session = StreamSession.objects.get(pk=session_id)
    except StreamSession.DoesNotExist:
        return Response({'error': 'Stream session not found'}, status=status.HTTP_404_NOT_FOUND)

    session.status   = 'stopped'
    session.ended_at = timezone.now()
    session.save()

    # غير status الكاميرا
    session.camera.status = 'inactive'
    session.camera.save()

    serializer = StreamSessionSerializer(session)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_stream_status(request, session_id):
    """بيتحدث لما الـ stream يبدأ فعلاً أو يحصل error"""
    try:
        session = StreamSession.objects.get(pk=session_id)
    except StreamSession.DoesNotExist:
        return Response({'error': 'Stream session not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    fps        = request.data.get('fps')
    resolution = request.data.get('resolution')
    error_log  = request.data.get('error_log')

    if new_status:
        session.status = new_status
    if fps:
        session.fps = fps
    if resolution:
        session.resolution = resolution
    if error_log:
        session.error_log = error_log

    session.save()

    serializer = StreamSessionSerializer(session)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hall_streams(request, hall_id):
    """جيب كل الـ streams بتاعة مدرج معين"""
    sessions = StreamSession.objects.filter(
        camera__hall_id=hall_id
    ).order_by('-started_at')

    serializer = StreamSessionSerializer(sessions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_streams(request):
    """جيب كل الـ streams الشغالة دلوقتي"""
    sessions = StreamSession.objects.filter(status='live')
    serializer = StreamSessionSerializer(sessions, many=True)
    return Response(serializer.data)