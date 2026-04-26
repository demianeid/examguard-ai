"""
Risk Scoring Engine — Phase 3
==============================
Computes a normalised risk score (0–100) for a student in a specific exam.

Formula
-------
  behavior_risk = min(70, sum_of_behavior_points × BEHAVIOR_MULTIPLIER)
  ai_risk       = min(30, ai_event_count × AI_EVENT_WEIGHT)
  risk_score    = round(behavior_risk + ai_risk, 1)

Behavior event weights (overrides score_points from the frontend):
  devtools            → 10  (high intent to cheat)
  tab_switch          → 8
  ai_object_detected  → 10
  ai_head_pose        → 5
  fullscreen_exit     → 5
  copy_paste          → 3
  keyboard_shortcut   → 2
  right_click         → 1
  other               → 2

The final score is capped at 100.

Risk bands
----------
  0  – 29  → LOW    (green)
  30 – 59  → MEDIUM (yellow/orange)
  60 – 79  → HIGH   (orange/red)
  80 – 100 → CRITICAL (red — instructor alerted)
"""

from django.db.models import Sum

# ── Weights per event_type (maps to risk points, independent of frontend score) ──
EVENT_WEIGHTS: dict[str, float] = {
    'devtools':           10.0,
    'tab_switch':          8.0,
    'ai_object_detected': 10.0,
    'ai_head_pose':        5.0,
    'fullscreen_exit':     5.0,
    'copy_paste':          3.0,
    'keyboard_shortcut':   2.0,
    'right_click':         1.0,
    'other':               2.0,
}

# Each raw AI event (cheating_detected=True) contributes this many risk points
AI_EVENT_WEIGHT: float = 6.0

# Maximum contribution from each source
MAX_BEHAVIOR_RISK: float = 70.0
MAX_AI_RISK: float = 30.0


def compute_risk_score(student, exam) -> float:
    """
    Compute and return the risk score (0–100) for a student in an exam.
    Imports are deferred to avoid circular imports at module load time.
    """
    from violation_Exam.models import ViolationBehavior, AIEventViolation

    # ── Behavior risk ─────────────────────────────────────────────────────────
    behaviors = ViolationBehavior.objects.filter(student=student, exam=exam)

    behavior_risk_raw = 0.0
    for v in behaviors:
        weight = EVENT_WEIGHTS.get(v.event_type, EVENT_WEIGHTS['other'])
        behavior_risk_raw += weight

    behavior_risk = min(MAX_BEHAVIOR_RISK, behavior_risk_raw)

    # ── AI risk ───────────────────────────────────────────────────────────────
    ai_count  = AIEventViolation.objects.filter(
        student=student, exam=exam, cheating_detected=True
    ).count()
    ai_risk   = min(MAX_AI_RISK, ai_count * AI_EVENT_WEIGHT)

    # ── Combined ──────────────────────────────────────────────────────────────
    score = round(behavior_risk + ai_risk, 1)
    return min(100.0, score)


def risk_band(score: float) -> str:
    """Return human-readable risk band for a score."""
    if score >= 80:
        return 'critical'
    if score >= 60:
        return 'high'
    if score >= 30:
        return 'medium'
    return 'low'


def risk_color(score: float) -> str:
    """Return a CSS colour name for the risk band."""
    band = risk_band(score)
    return {
        'critical': 'red',
        'high':     'orange',
        'medium':   'yellow',
        'low':      'green',
    }[band]
