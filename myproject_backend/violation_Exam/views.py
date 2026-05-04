from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Sum, Count

from exam.models import Exam, ExamSession, ExamResult
from .models import ViolationBehavior, AIEventViolation, AudioViolation
from .serializers import ViolationBehaviorSerializer, AIEventViolationSerializer, AudioViolationSerializer
from .risk_engine import compute_risk_score, risk_band, risk_color


class PostBehaviorViolationView(APIView):
    """POST /api/violations/behavior/ — student sends a behavior event."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        exam_id = request.data.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        violation = ViolationBehavior.objects.create(
            student          = request.user,
            exam             = exam,
            event_type       = request.data.get('event_type', 'other'),
            score_points     = request.data.get('score_points', 0),
            cumulative_score = request.data.get('cumulative_score', 0),
            details          = request.data.get('details', ''),
            snapshot         = request.data.get('snapshot', ''),
        )

        # Auto-update risk score in ExamResult if it already exists
        _refresh_risk_score(request.user, exam)

        return Response(ViolationBehaviorSerializer(violation).data, status=status.HTTP_201_CREATED)


class PostAIViolationView(APIView):
    """POST /api/violations/ai/ — student sends an AI cheating event."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        exam_id = request.data.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        event = AIEventViolation.objects.create(
            student           = request.user,
            exam              = exam,
            cheating_detected = request.data.get('cheating_detected', True),
            cheating_reason   = request.data.get('cheating_reason', ''),
            head_direction    = request.data.get('head_direction', ''),
            head_suspicious   = request.data.get('head_suspicious', False),
            yolo_suspicious   = request.data.get('yolo_suspicious', False),
            yolo_labels       = request.data.get('yolo_labels', []),
            h_ratio           = request.data.get('h_ratio', 0.0),
            v_ratio           = request.data.get('v_ratio', 0.0),
        )

        # Auto-update risk score in ExamResult if it already exists
        _refresh_risk_score(request.user, exam)

        return Response(AIEventViolationSerializer(event).data, status=status.HTTP_201_CREATED)


class PostAudioViolationView(APIView):
    """POST /api/violations/audio/ — student sends an audio anomaly event."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        exam_id = request.data.get('exam_id')
        if not exam_id:
            return Response({'error': 'exam_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        event = AudioViolation.objects.create(
            student    = request.user,
            exam       = exam,
            event_type = request.data.get('event_type', 'loud_noise'),
            db_level   = request.data.get('db_level', 0.0),
            reason     = request.data.get('reason', ''),
        )



        _refresh_risk_score(request.user, exam)

        return Response(AudioViolationSerializer(event).data, status=status.HTTP_201_CREATED)


# ── Internal helper ───────────────────────────────────────────────────────────
def _refresh_risk_score(student, exam):
    """If an ExamResult already exists, recompute + save its risk_score."""
    try:
        result = ExamResult.objects.get(student=student, exam=exam)
        result.risk_score = compute_risk_score(student, exam)
        result.save(update_fields=['risk_score'])
    except ExamResult.DoesNotExist:
        pass  # Not submitted yet — will be computed at submit time


class ExamViolationSummaryView(APIView):
    """GET /api/violations/exam/<exam_id>/ — all violations for an exam."""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        behaviors = ViolationBehavior.objects.filter(exam=exam).order_by('-occurred_at')
        ai_events = AIEventViolation.objects.filter(exam=exam).order_by('-occurred_at')
        audio_events = AudioViolation.objects.filter(exam=exam).order_by('-occurred_at')
        return Response({
            'exam_id':     exam_id,
            'behaviors':   ViolationBehaviorSerializer(behaviors, many=True).data,
            'ai_events':   AIEventViolationSerializer(ai_events, many=True).data,
            'audio_events': AudioViolationSerializer(audio_events, many=True).data,
        })


class StudentViolationSummaryView(APIView):
    """GET /api/violations/exam/<exam_id>/student/<student_id>/"""
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, exam_id, student_id):
        behaviors = ViolationBehavior.objects.filter(
            exam_id=exam_id, student_id=student_id
        ).order_by('-occurred_at')
        ai_events = AIEventViolation.objects.filter(
            exam_id=exam_id, student_id=student_id
        ).order_by('-occurred_at')
        audio_events = AudioViolation.objects.filter(
            exam_id=exam_id, student_id=student_id
        ).order_by('-occurred_at')

        behavior_score = sum(float(v.score_points) for v in behaviors)
        return Response({
            'exam_id':          exam_id,
            'student_id':       student_id,
            'behavior_score':   round(behavior_score, 1),
            'ai_event_count':   ai_events.count(),
            'audio_event_count': audio_events.count(),
            'behaviors':        ViolationBehaviorSerializer(behaviors, many=True).data,
            'ai_events':        AIEventViolationSerializer(ai_events, many=True).data,
            'audio_events':     AudioViolationSerializer(audio_events, many=True).data,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 — Instructor Dashboard endpoints
# ─────────────────────────────────────────────────────────────────────────────

def _student_status(violation_score: float) -> str:
    if violation_score >= 7:
        return 'flagged'
    if violation_score >= 3:
        return 'warning'
    return 'online'


class ExamLiveStatusView(APIView):
    """
    GET /api/violations/exam/<exam_id>/live-status/

    Returns every student who has started the exam with:
      name, is_active, violation_score, ai_event_count,
      status (online|warning|flagged), progress %.

    Polled every 10 s by ProctoringPage.tsx.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        sessions = ExamSession.objects.filter(exam=exam).select_related('student')

        # Violation score per student
        score_map = {
            row['student_id']: float(row['total_score'] or 0)
            for row in ViolationBehavior.objects
                .filter(exam=exam)
                .values('student_id')
                .annotate(total_score=Sum('score_points'))
        }

        # AI event count per student
        ai_map = {
            row['student_id']: row['total']
            for row in AIEventViolation.objects
                .filter(exam=exam)
                .values('student_id')
                .annotate(total=Count('id'))
        }

        # Audio event count per student
        audio_map = {
            row['student_id']: row['total']
            for row in AudioViolation.objects
                .filter(exam=exam)
                .values('student_id')
                .annotate(total=Count('id'))
        }

        # Progress from ExamResult
        progress_map = {}
        for r in ExamResult.objects.filter(exam=exam).select_related('student'):
            if r.total_marks > 0:
                progress_map[r.student_id] = int(
                    (float(r.total_marks_obtained) / float(r.total_marks)) * 100
                )

        total_questions = exam.questions.count()

        results_map = {
            r.student_id: r
            for r in ExamResult.objects.filter(exam=exam)
        }

        students_data = []
        for session in sessions:
            sid       = session.student_id
            v_score   = score_map.get(sid, 0.0)
            r_score   = compute_risk_score(session.student, exam)
            
            # Determine status based on ExamResult first, then current score
            res = results_map.get(sid)
            if res:
                status_val = 'submitted'
            else:
                status_val = _student_status(v_score)

            students_data.append({
                'student_id':     session.student.custom_id,
                'db_id':          sid,
                'name':           session.student.get_full_name() or session.student.email,
                'email':          session.student.email,
                'profile_image':  (
                    session.student.profile_image.url
                    if session.student.profile_image else None
                ),
                'is_active':      session.is_active,
                'violation_score': round(v_score, 1),
                'ai_event_count': ai_map.get(sid, 0),
                'audio_event_count': audio_map.get(sid, 0),
                'status':         status_val,
                'progress':       progress_map.get(sid, 0),
                'started_at':     session.started_at.isoformat(),
                'risk_score':     r_score,
                'risk_band':      risk_band(r_score),
                'risk_color':     risk_color(r_score),
            })

        order = {'flagged': 0, 'warning': 1, 'online': 2}
        students_data.sort(key=lambda s: order.get(s['status'], 3))

        return Response({
            'exam_id':         exam_id,
            'total_students':  len(students_data),
            'total_questions': total_questions,
            'flagged':         sum(1 for s in students_data if s['status'] == 'flagged'),
            'warning':         sum(1 for s in students_data if s['status'] == 'warning'),
            'online':          sum(1 for s in students_data if s['status'] == 'online'),
            'students':        students_data,
        })


class ExamIncidentsView(APIView):
    """
    GET /api/violations/exam/<exam_id>/incidents/

    Returns violations grouped by severity (high / medium / low).

    Severity rules:
      high   — devtools, ai_object_detected, score >= 2
      medium — tab_switch, ai_head_pose, fullscreen_exit, score >= 1
      low    — everything else
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    HIGH_EVENTS   = {'devtools', 'ai_object_detected', 'ai_multiple_faces'}
    MEDIUM_EVENTS = {'tab_switch', 'ai_head_pose', 'fullscreen_exit', 'ai_audio_violation'}

    def _severity(self, event_type: str, score_points: float) -> str:
        if event_type in self.HIGH_EVENTS or score_points >= 2:
            return 'high'
        if event_type in self.MEDIUM_EVENTS or score_points >= 1:
            return 'medium'
        return 'low'

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        behaviors = (
            ViolationBehavior.objects
            .filter(exam=exam)
            .select_related('student')
            .order_by('-occurred_at')
        )

        high, medium, low = [], [], []

        for v in behaviors:
            sev = self._severity(v.event_type, float(v.score_points))
            item = {
                'id':           v.id,
                'type':         'behavior',
                'student_id':   v.student.custom_id,
                'student_name': v.student.get_full_name() or v.student.email,
                'event':        v.details or v.get_event_type_display(),
                'event_type':   v.event_type,
                'score_points': float(v.score_points),
                'time':         v.occurred_at.strftime('%I:%M %p'),
                'occurred_at':  v.occurred_at.isoformat(),
                'snapshot':     v.snapshot,
            }
            (high if sev == 'high' else medium if sev == 'medium' else low).append(item)

        for bucket in (high, medium, low):
            bucket.sort(key=lambda x: x['occurred_at'], reverse=True)

        return Response({
            'exam_id': exam_id,
            'total':   len(high) + len(medium) + len(low),
            'high':    high,
            'medium':  medium,
            'low':     low,
        })


class ExamRiskScoresView(APIView):
    """
    GET /api/violations/exam/<exam_id>/risk-scores/

    Returns a risk score leaderboard (highest risk first) for all students
    who have started the exam. Includes band, color, and alert flag.

    alert=True when risk_score >= 80 (CRITICAL band).
    Polled every 10 s by the ProctoringPage Risk tab.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        sessions = ExamSession.objects.filter(exam=exam).select_related('student')

        data = []
        for session in sessions:
            r = compute_risk_score(session.student, exam)
            data.append({
                'student_id':   session.student.custom_id,
                'db_id':        session.student_id,
                'name':         session.student.get_full_name() or session.student.email,
                'risk_score':   r,
                'risk_band':    risk_band(r),
                'risk_color':   risk_color(r),
                'alert':        r >= 80,
                'is_active':    session.is_active,
            })

        # Sort highest risk first
        data.sort(key=lambda x: x['risk_score'], reverse=True)

        critical_count = sum(1 for d in data if d['risk_band'] == 'critical')
        high_count     = sum(1 for d in data if d['risk_band'] == 'high')

        return Response({
            'exam_id':        exam_id,
            'total_students': len(data),
            'critical_count': critical_count,
            'high_count':     high_count,
            'students':       data,
        })

class ExamExportAuditTrailView(APIView):
    """
    GET /api/violations/exam/<exam_id>/export-audit/

    Returns a combined, chronological JSON array of all ViolationBehavior
    and AIEventViolation records for a given exam. 
    Intended to be converted into a CSV on the frontend for instructor audit trails.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def get(self, request, exam_id):
        try:
            exam = Exam.objects.get(pk=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get Behavioral Violations
        behavioral_qs = ViolationBehavior.objects.filter(exam=exam).select_related('student')
        
        # Get AI Violations
        ai_qs = AIEventViolation.objects.filter(exam=exam).select_related('student')

        events = []
        
        for b in behavioral_qs:
            events.append({
                'timestamp': b.occurred_at.isoformat(),
                'time': b.occurred_at.strftime('%Y-%m-%d %H:%M:%S'),
                'student_id': b.student.custom_id,
                'student_name': b.student.get_full_name() or b.student.email,
                'event_type': 'Behavioral',
                'description': b.get_event_type_display(),
                'severity': 'Medium',  # Typically tab switches are medium
                'details': b.details or '',
                'score_impact': float(b.score_points),
            })
            
        for a in ai_qs:
            # Determine severity based on YOLO labels (similar to risk_engine)
            yolo_labels = [label.lower() for label in a.yolo_labels] if isinstance(a.yolo_labels, list) else []
            critical_objects = {'cell phone', 'remote', 'keyboard', 'laptop'}
            severity = 'High' if set(yolo_labels) & critical_objects else ('Medium' if a.yolo_suspicious else 'Low')
            if a.head_suspicious and severity == 'Low':
                severity = 'Medium'
                
            pts = 1.0
            if a.yolo_suspicious:
                pts = 2.0
            elif a.head_direction == 'NO FACE':
                if a.cheating_reason and 'CRITICAL' in a.cheating_reason:
                    pts = 2.0
                else:
                    pts = 0.5
                    
            events.append({
                'timestamp': a.occurred_at.isoformat(),
                'time': a.occurred_at.strftime('%Y-%m-%d %H:%M:%S'),
                'student_id': a.student.custom_id,
                'student_name': a.student.get_full_name() or a.student.email,
                'event_type': 'AI Detection',
                'description': a.cheating_reason or 'Suspicious behavior detected',
                'severity': severity,
                'details': f"Labels: {', '.join(yolo_labels)} | Head: {a.head_direction}",
                'score_impact': pts,
            })

        # Sort chronologically (oldest to newest)
        events.sort(key=lambda x: x['timestamp'])

        return Response({
            'exam_id': exam_id,
            'exam_title': exam.title,
            'total_events': len(events),
            'events': events,
        })
