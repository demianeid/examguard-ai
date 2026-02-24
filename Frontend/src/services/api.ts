// ============================================================
// api.ts — Centralized API Service
// src/services/api.ts
// ============================================================

const API_BASE = "http://127.0.0.1:8000/api"; // ✅ Django URL

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
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // نرسل التوكن فقط إذا كان موجوداً (عشان الـ Login والـ Register مش محتاجين توكن)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // بنرمي الـ object كامل عشان تقدر تمسك الـ error message في الـ catch
    throw errorData; 
  }

  if (res.status === 204) return undefined as T;

  return res.json();
};

// ============================================================
// Classes API
// ============================================================
export const classesApi = {
  /** جيب كل الكلاسات */
  getAll: (): Promise<ClassType[]> => request<ClassType[]>("/classes/"),

  /** أنشئ كلاس جديد */
  create: (payload: CreateClassPayload): Promise<ClassType> =>
    request<ClassType>("/classes/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** عدّل كلاس */
  update: (id: number, payload: UpdateClassPayload): Promise<ClassType> =>
    request<ClassType>(`/classes/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** احذف كلاس */
  delete: (id: number): Promise<void> =>
    request<void>(`/classes/${id}/`, { method: "DELETE" }),
};

// ============================================================
// Auth API (Password Reset & OTP)
// مطابقة تماماً للـ Views اللي أنت بعتها في الـ Django
// ============================================================
export const authApi = {
  /** 1. ارسال طلب OTP (ForgetPasswordView) */
  forgotPassword: (email: string): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/forget-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  /** 2. التحقق من الكود (VerifyOtpView) */
  verifyOtp: (email: string, otp: string): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/verify-otp/", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  /** 3. تغيير الباسورد (ResetPasswordView) */
  resetPassword: (payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> =>
    request<{ message: string }>("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};