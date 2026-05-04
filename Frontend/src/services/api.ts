
// ============================================================
// api.ts — Centralized API Service (Final & Correct)
// ============================================================
import api from '../api';


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

// --- Generic request helper (powered by axios instance) ---
const request = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const method = (options?.method || 'GET').toLowerCase();
  const data = options?.body ? JSON.parse(options.body as string) : undefined;
  const response = await api.request<T>({ url: endpoint, method, data });
  return response.data;
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
    request<{ message: string }>("/api/auth/forget-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /** 2. التحقق من الكود */
  verifyOtp: (email: string, otp: string): Promise<{ message: string }> =>
    request<{ message: string }>("/api/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  /** 3. تغيير الباسوورد (التحديث الفعلي) ✅ */
  resetPassword: (payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> =>
    request<{ message: string }>("/api/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

//machine 
export const faceApi = {
  register: (payload: { student_id: string; name: string; image: string }) =>
    request<{ success: boolean; message: string }>("/api/face/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verify: (payload: { student_id: string; image: string }) =>
    request<{ success: boolean; verified: boolean; message: string; student_name: string; confidence: number }>("/api/face/verify/", {
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
  computed_status: string;
}

export interface StudentZone {
  id: number;
  hall: number;
  camera?: number;
  camera_name: string;
  student_name: string;          // static field stored at zone creation
  student_code: string;
  seat_number: string;
  dynamic_student_name: string;  // resolved from HallEnrollment (current name)
  dynamic_seat_number: string;   // resolved from HallEnrollment (current seat)
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
  zone: number;
  student_name: string;
  student_code: string;
  seat_number: string;
  session: number;
  exam_title: string;
  total_alerts: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  violation_score: number;
  // populated client-side for display
  student_id?: string;
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
      body: JSON.stringify({ ...payload, hall: hallId }),  // ← أضف hall هنا
    }),

  delete: (cameraId: number): Promise<void> =>
    request<void>(`/api/hardware/monitoring/cameras/${cameraId}/`, {
      method: "DELETE",
    }),
};

// ============================================================
// Offline Exam API
// ============================================================
export const offlineExamApi = {
  getAll: (): Promise<OfflineExam[]> =>
    request<OfflineExam[]>("/api/hardware/monitoring/exams/"),

  getById: (examId: number): Promise<OfflineExam> =>
    request<OfflineExam>(`/api/hardware/monitoring/exams/${examId}/`),

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

  create: (examId: number, payload: {
    student_code?: string;
    student_name?: string;
    camera?: number;
    seat_number?: string;
    x1: number; y1: number; x2: number; y2: number;
  }): Promise<StudentZone> =>
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

// ============================================================
// Hall Enrollment API
// ============================================================
export interface HallEnrollment {
  id: number;
  hall: number;
  student_name?: string;
  student_code?: string;
  seat_number?: string;
  enrolled_at?: string;
}

export const hallEnrollmentApi = {
  getByHall: (hallId: number): Promise<HallEnrollment[]> =>
    request<HallEnrollment[]>(`/api/hardware/monitoring/halls/${hallId}/students/`),

  create: (hallId: number, payload: { student_name: string; student_code: string; seat_number?: string ;student?: number; }): Promise<HallEnrollment> =>
  request<HallEnrollment>(`/api/hardware/monitoring/halls/${hallId}/students/`, {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  bulkUpload: async (hallId: number, file: File): Promise<{ created: number; skipped: number; errors: {row: number; reason: string}[]; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    // Use the underlying axios instance directly for multipart
    const { default: axiosInstance } = await import("../api");
    const response = await axiosInstance.post(
      `/api/hardware/monitoring/halls/${hallId}/students/bulk-upload/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  update: (enrollmentId: number, payload: Partial<HallEnrollment>): Promise<HallEnrollment> =>
    request<HallEnrollment>(`/api/hardware/monitoring/halls/students/${enrollmentId}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (enrollmentId: number): Promise<void> =>
    request<void>(`/api/hardware/monitoring/halls/students/${enrollmentId}/`, {
      method: "DELETE",
    }),
};
export const studentListApi = {
  getAll: (): Promise<{id: number, name: string, email: string}[]> =>
    request('/api/hardware/monitoring/students/list/'),
};

// ============================================================
// Notifications API
// ============================================================
export interface NotificationItemBackend {
  id: number;
  type: "exam" | "grade" | "system" | "announcement";
  title: string;
  content: string;
  priority?: "low" | "medium" | "high" | "critical";
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export const notificationApi = {
  getAll: (): Promise<NotificationItemBackend[]> =>
    request<NotificationItemBackend[]>("/api/notifications/"),

  markAsRead: (id: number): Promise<{ status: string }> =>
    request<{ status: string }>(`/api/notifications/${id}/read/`, { method: "POST" }),

  markAllAsRead: (): Promise<{ status: string }> =>
    request<{ status: string }>("/api/notifications/read-all/", { method: "POST" }),

  delete: (id: number): Promise<void> =>
    request<void>(`/api/notifications/${id}/`, { method: "DELETE" }),

  clearAll: (): Promise<void> =>
    request<void>("/api/notifications/clear/", { method: "DELETE" }),
};