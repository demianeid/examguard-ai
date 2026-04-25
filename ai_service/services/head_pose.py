import mediapipe as mp

_face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)


def get_head_pose(landmarks, w: int, h: int) -> tuple[float, float]:
    nose       = landmarks[1]
    chin       = landmarks[152]
    forehead   = landmarks[10]
    left_face  = landmarks[234]
    right_face = landmarks[454]

    nose_x     = nose.x * w
    center_x   = (left_face.x + right_face.x) / 2 * w
    face_width  = abs(right_face.x - left_face.x) * w

    nose_y      = nose.y * h
    center_y    = (forehead.y + chin.y) / 2 * h
    face_height = abs(chin.y - forehead.y) * h

    h_ratio = (nose_x - center_x) / (face_width  + 1e-6)
    v_ratio = (nose_y - center_y) / (face_height + 1e-6)

    return h_ratio, v_ratio


def analyze_frame(rgb_frame):
    HORIZONTAL_THRESHOLD = 0.12
    VERTICAL_THRESHOLD   = 0.10

    h, w = rgb_frame.shape[:2]

    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
    ) as face_mesh:
        result = face_mesh.process(rgb_frame)

    if not result.multi_face_landmarks:
        return {
            "face_detected": False,
            "h_ratio": 0.0,
            "v_ratio": 0.0,
            "direction": "NO FACE",
            "suspicious": True,
        }

    lm = result.multi_face_landmarks[0].landmark
    h_ratio, v_ratio = get_head_pose(lm, w, h)

    suspicious = False
    direction  = ""

    if h_ratio > HORIZONTAL_THRESHOLD:
        suspicious = True
        direction  = "LOOKING RIGHT"
    elif h_ratio < -HORIZONTAL_THRESHOLD:
        suspicious = True
        direction  = "LOOKING LEFT"

    if v_ratio > VERTICAL_THRESHOLD:
        suspicious = True
        direction  = "LOOKING DOWN" if not direction else direction + " + DOWN"

    return {
        "face_detected": True,
        "h_ratio":   round(h_ratio, 4),
        "v_ratio":   round(v_ratio, 4),
        "direction": direction,
        "suspicious": suspicious,
    }