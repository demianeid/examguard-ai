
// ============================================================
// api.ts — Centralized API Service (Final & Correct)
// ============================================================
const API_BASE = "http://127.0.0.1:8000";


// --- Types ---
export interface ClassType {
  id: number;
  name: string;
  students: number;
  activeExams: number;
  pendingReviews: number;
  avgScore: number;
  color: string;
  code: string;
  subject?: string;
  description?: string;
}

export interface CreateClassPayload {
  name: string;
  subject: string;
  students: number;
  description?: string;
  color: string;
  code: string;
}

export interface UpdateClassPayload {
  name: string;
  subject: string;
  students: number;
  description?: string;
}

// --- Generic fetch helper ---
const request = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // نرسل التوكن فقط إذا كان موجوداً
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // بنرمي الـ error عشان الـ catch في الـ UI تمسكه
    throw errorData; 
  }

  if (res.status === 204) return undefined as T;

  return res.json();
};

// ============================================================
// Classes API (Static/Mock) ✅
// دي هترجع داتا من غير ما تلمس السيرفر عشان الـ 404 تختفي
// ============================================================
export const classesApi = {
  /** جيب كل الكلاسات (Mock) */
  getAll: async (): Promise<ClassType[]> => {
    return [
      {
        id: 1,
        name: "Static Demo Class",
        subject: "Computer Science",
        students: 20,
        activeExams: 1,
        pendingReviews: 0,
        avgScore: 85,
        color: "#4F46E5",
        code: "DEMO-101",
      }
    ];
  },

  /** إنشاء كلاس (Mock) */
  create: async (payload: CreateClassPayload): Promise<ClassType> => {
    console.log("Mocking creation for:", payload);
    return {
      ...payload,
      id: Math.floor(Math.random() * 1000),
      activeExams: 0,
      pendingReviews: 0,
      avgScore: 0,
    };
  },

  /** تعديل (Mock) */
  update: async (id: number, payload: UpdateClassPayload): Promise<ClassType> => {
    return { id, ...payload, activeExams: 0, pendingReviews: 0, avgScore: 0, color: 'blue', code: 'STATIC' };
  },

  /** حذف (Mock) */
  delete: async (id: number): Promise<void> => {
    return;
  },
};

// ============================================================
// Auth API (Real Connection) 🚀
// بيكلم الـ Django فعلياً ومطابق للـ Views بتاعتك
// ============================================================
export const authApi = {
  /** 1. ارسال طلب OTP */
  forgotPassword: (email: string): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/forget-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /** 2. التحقق من الكود */
  verifyOtp: (email: string, otp: string): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  /** 3. تغيير الباسوورد (التحديث الفعلي) ✅ */
  resetPassword: (payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

//machine 
export const faceApi = {
  register: (payload: { student_id: string; name: string; image: string }) =>
    request<{ success: boolean; message: string }>("/student/face/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verify: (payload: { student_id: string; image: string }) =>
    request<{ success: boolean; verified: boolean; message: string; student_name: string; confidence: number }>("/student/face/verify/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ============================================================
// Hardware Monitoring — Types
// ============================================================
export interface ExamHall {
  id: number;
  name: string;
  building: string;
  capacity: number;
  is_active: boolean;
}

export interface Camera {
  id: number;
  name: string;
  hall: number;
  stream_url: string;
  status: string;
}

export interface OfflineExam {
  id: number;
  title: string;
  hall: number;
  hall_name: string;
  professor_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface StudentZone {
  id: number;
  exam: number;
  camera: number;
  student: number;
  student_name: string;
  camera_name: string;
  seat_number: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MonitoringSession {
  id: number;
  exam: number;
  exam_title: string;
  hall_name: string;
  status: string;
  started_at: string;
  ended_at: string;
  total_alerts: number;
}

export interface Alert {
  id: number;
  session: number;
  zone: number;
  seat_number: string;
  student_name: string;
  alert_type: string;
  severity: string;
  timestamp: string;
  is_reviewed: boolean;
}

export interface ViolationLog {
  id: number;
  student: number;
  student_name: string;
  session: number;
  exam_title: string;
  total_alerts: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  violation_score: number;
}

export interface StreamSession {
  id: number;
  camera: number;
  camera_name: string;
  hall_name: string;
  status: string;
  fps: number;
  resolution: string;
  started_at: string;
  ended_at: string;
  duration: string;
}

// ============================================================
// Exam Hall API
// ============================================================
export const examHallApi = {
  getAll: (): Promise<ExamHall[]> =>
    request<ExamHall[]>("/api/hardware/monitoring/halls/"),

  create: (payload: Partial<ExamHall>): Promise<ExamHall> =>
    request<ExamHall>("/api/hardware/monitoring/halls/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<ExamHall>): Promise<ExamHall> =>
    request<ExamHall>(`/api/hardware/monitoring/halls/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: number): Promise<void> =>
    request<void>(`/api/hardware/monitoring/halls/${id}/`, { method: "DELETE" }),
};

// ============================================================
// Camera API
// ============================================================
export const cameraApi = {
  getByHall: (hallId: number): Promise<Camera[]> =>
    request<Camera[]>(`/api/hardware/monitoring/halls/${hallId}/cameras/`),

  create: (hallId: number, payload: Partial<Camera>): Promise<Camera> =>
    request<Camera>(`/api/hardware/monitoring/halls/${hallId}/cameras/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ============================================================
// Offline Exam API
// ============================================================
export const offlineExamApi = {
  getAll: (): Promise<OfflineExam[]> =>
    request<OfflineExam[]>("/api/hardware/monitoring/exams/"),

  create: (payload: Partial<OfflineExam>): Promise<OfflineExam> =>
    request<OfflineExam>("/api/hardware/monitoring/exams/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<OfflineExam>): Promise<OfflineExam> =>
    request<OfflineExam>(`/api/hardware/monitoring/exams/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: number): Promise<void> =>
    request<void>(`/api/hardware/monitoring/exams/${id}/`, { method: "DELETE" }),
};

// ============================================================
// Student Zone API
// ============================================================
export const studentZoneApi = {
  getByExam: (examId: number): Promise<StudentZone[]> =>
    request<StudentZone[]>(`/api/hardware/monitoring/exams/${examId}/zones/`),

  create: (examId: number, payload: Partial<StudentZone>): Promise<StudentZone> =>
    request<StudentZone>(`/api/hardware/monitoring/exams/${examId}/zones/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  delete: (id: number): Promise<void> =>
    request<void>(`/api/hardware/monitoring/zones/${id}/`, { method: "DELETE" }),
};

// ============================================================
// Monitoring (Detection) API
// ============================================================
export const monitoringApi = {
  startMonitoring: (examId: number): Promise<MonitoringSession> =>
    request<MonitoringSession>(`/api/hardware/detection/exams/${examId}/start/`, {
      method: "POST",
    }),

  endMonitoring: (sessionId: number): Promise<MonitoringSession> =>
    request<MonitoringSession>(`/api/hardware/detection/sessions/${sessionId}/end/`, {
      method: "POST",
    }),

  getSession: (examId: number): Promise<MonitoringSession> =>
    request<MonitoringSession>(`/api/hardware/detection/exams/${examId}/session/`),

  getAlerts: (sessionId: number): Promise<Alert[]> =>
    request<Alert[]>(`/api/hardware/detection/sessions/${sessionId}/alerts/`),

  createAlert: (sessionId: number, payload: Partial<Alert>): Promise<Alert> =>
    request<Alert>(`/api/hardware/detection/sessions/${sessionId}/alerts/`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  reviewAlert: (alertId: number): Promise<Alert> =>
    request<Alert>(`/api/hardware/detection/alerts/${alertId}/review/`, {
      method: "PUT",
    }),

  getViolations: (sessionId: number): Promise<ViolationLog[]> =>
    request<ViolationLog[]>(`/api/hardware/detection/sessions/${sessionId}/violations/`),

  generateReport: (sessionId: number): Promise<{ message: string }> =>
    request<{ message: string }>(`/api/hardware/detection/sessions/${sessionId}/generate-report/`, {
      method: "POST",
    }),
};

// ============================================================
// Stream API
// ============================================================
export const streamApi = {
  startStream: (cameraId: number): Promise<StreamSession> =>
    request<StreamSession>(`/api/hardware/stream/cameras/${cameraId}/start/`, {
      method: "POST",
    }),

  stopStream: (sessionId: number): Promise<StreamSession> =>
    request<StreamSession>(`/api/hardware/stream/streams/${sessionId}/stop/`, {
      method: "POST",
    }),

  updateStream: (sessionId: number, payload: Partial<StreamSession>): Promise<StreamSession> =>
    request<StreamSession>(`/api/hardware/stream/streams/${sessionId}/update/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getHallStreams: (hallId: number): Promise<StreamSession[]> =>
    request<StreamSession[]>(`/api/hardware/stream/halls/${hallId}/streams/`),

  getActiveStreams: (): Promise<StreamSession[]> =>
    request<StreamSession[]>("/api/hardware/stream/streams/active/"),
};