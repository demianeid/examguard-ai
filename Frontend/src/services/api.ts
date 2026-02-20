// ============================================================
// api.ts — Centralized API Service
// ضع هذا الملف في: src/services/api.ts
// ============================================================

// غيّر الـ URL ده لو البيك-إند بيشتغل على بورت تاني
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // لو بتستخدم JWT Authentication حط التوكن هنا:
      // Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }

  // لو الـ response فاضي (مثل DELETE 204)
  if (res.status === 204) return undefined as T;

  return res.json();
};

// ============================================================
// Classes API
// ============================================================
export const classesApi = {
  /** GET /api/classes — جيب كل الكلاسات */
  getAll: (): Promise<ClassType[]> => request<ClassType[]>("/classes"),

  /** POST /api/classes — أنشئ كلاس جديد */
  create: (payload: CreateClassPayload): Promise<ClassType> =>
    request<ClassType>("/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** PUT /api/classes/:id — عدّل كلاس */
  update: (id: number, payload: UpdateClassPayload): Promise<ClassType> =>
    request<ClassType>(`/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  /** DELETE /api/classes/:id — احذف كلاس */
  delete: (id: number): Promise<void> =>
    request<void>(`/classes/${id}`, { method: "DELETE" }),
};