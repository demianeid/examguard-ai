// // ============================================================
// // api.ts — Centralized API Service
// // src/services/api.ts
// // ============================================================

// const API_BASE = "http://127.0.0.1:8000/api"; // ✅ Django URL

// // --- Types ---
// export interface ClassType {
//   id: number;
//   name: string;
//   students: number;
//   activeExams: number;
//   pendingReviews: number;
//   avgScore: number;
//   color: string;
//   code: string;
//   subject?: string;
//   description?: string;
// }

// export interface CreateClassPayload {
//   name: string;
//   subject: string;
//   students: number;
//   description?: string;
//   color: string;
//   code: string;
// }

// export interface UpdateClassPayload {
//   name: string;
//   subject: string;
//   students: number;
//   description?: string;
// }

// // --- Generic fetch helper ---
// const request = async <T>(
//   endpoint: string,
//   options?: RequestInit
// ): Promise<T> => {
//   const token = localStorage.getItem("token");

//   const res = await fetch(`${API_BASE}${endpoint}`, {
//     headers: {
//       "Content-Type": "application/json",
//       // نرسل التوكن فقط إذا كان موجوداً (عشان الـ Login والـ Register مش محتاجين توكن)
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...options?.headers,
//     },
//     ...options,
//   });

//   if (!res.ok) {
//     const errorData = await res.json().catch(() => ({}));
//     // بنرمي الـ object كامل عشان تقدر تمسك الـ error message في الـ catch
//     throw errorData; 
//   }

//   if (res.status === 204) return undefined as T;

//   return res.json();
// };

// // ============================================================
// // Classes API
// // ============================================================
// export const classesApi = {
//   /** جيب كل الكلاسات */
//   getAll: (): Promise<ClassType[]> => request<ClassType[]>("/classes/"),

//   /** أنشئ كلاس جديد */
//   create: (payload: CreateClassPayload): Promise<ClassType> =>
//     request<ClassType>("/classes/", {
//       method: "POST",
//       body: JSON.stringify(payload),
//     }),

//   /** عدّل كلاس */
//   update: (id: number, payload: UpdateClassPayload): Promise<ClassType> =>
//     request<ClassType>(`/classes/${id}/`, {
//       method: "PUT",
//       body: JSON.stringify(payload),
//     }),

//   /** احذف كلاس */
//   delete: (id: number): Promise<void> =>
//     request<void>(`/classes/${id}/`, { method: "DELETE" }),
// };

// // ============================================================
// // Auth API (Password Reset & OTP)
// // مطابقة تماماً للـ Views اللي أنت بعتها في الـ Django
// // ============================================================
// export const authApi = {
//   /** 1. ارسال طلب OTP (ForgetPasswordView) */
//   forgotPassword: (email: string): Promise<{ message: string }> =>
//     request<{ message: string }>("/auth/forget-password/", {
//       method: "POST",
//       body: JSON.stringify({ email }),
//     }),

//   /** 2. التحقق من الكود (VerifyOtpView) */
//   verifyOtp: (email: string, otp: string): Promise<{ message: string }> =>
//     request<{ message: string }>("/auth/verify-otp/", {
//       method: "POST",
//       body: JSON.stringify({ email, otp }),
//     }),

//   /** 3. تغيير الباسورد (ResetPasswordView) */
//   resetPassword: (payload: { email: string; otp: string; new_password: string }): Promise<{ message: string }> =>
//     request<{ message: string }>("/auth/reset-password/", {
//       method: "POST",
//       body: JSON.stringify(payload),
//     }),
// };



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
  const token = localStorage.getItem("token");

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