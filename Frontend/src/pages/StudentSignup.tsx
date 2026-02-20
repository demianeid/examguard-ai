import React, { useState } from "react";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Link } from "react-router-dom";

// ============================================================
// 🔧 غير الـ URL ده لو الـ Django شغال على بورت تاني
// ============================================================
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function StudentSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profileImage: null as File | null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // امسح الـ error لما المستخدم يبدأ يكتب
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
    if (apiError) setApiError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, profileImage: "Invalid file type." });
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: "File size exceeds 3MB." });
        return;
      }

      setErrors({ ...errors, profileImage: "" });
      setFormData({ ...formData, profileImage: file });

      // Preview الصورة
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address.";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s+/g, "")))
      newErrors.phone = "Invalid phone number.";

    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!formData.profileImage) newErrors.profileImage = "Profile image is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ بدل console.log — بيبعت POST request لـ Django
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      // ✅ FormData عشان نبعت الصورة مع البيانات
      const data = new FormData();
      data.append("first_name", formData.firstName);
      data.append("last_name", formData.lastName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("password", formData.password);
      data.append("password_confirm", formData.confirmPassword);
      data.append("role", "student"); // ← عشان الباك يعرف إنه Student
      if (formData.profileImage) {
        data.append("profile_image", formData.profileImage);
      }

      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: "POST",
        // ❌ متحطش Content-Type — المتصفح هيحدده تلقائياً مع الـ boundary
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // ✅ لو Django رجع field errors (مثلاً email موجود قبل كده)
        if (errorData && typeof errorData === "object") {
          const fieldErrors: { [key: string]: string } = {};
          const fieldMap: { [key: string]: string } = {
            first_name: "firstName",
            last_name: "lastName",
            email: "email",
            phone: "phone",
            password: "password",
            profile_image: "profileImage",
          };

          let hasFieldError = false;
          Object.entries(errorData).forEach(([key, value]) => {
            const frontendKey = fieldMap[key] || key;
            fieldErrors[frontendKey] = Array.isArray(value)
              ? (value as string[])[0]
              : String(value);
            hasFieldError = true;
          });

          if (hasFieldError) {
            setErrors(fieldErrors);
          } else {
            setApiError(errorData.detail || errorData.message || "Registration failed. Please try again.");
          }
        } else {
          setApiError("Registration failed. Please try again.");
        }
        return;
      }

      const result = await response.json();

      // ✅ لو الباك رجع توكن، احتفظ بيه
      if (result.token) {
        localStorage.setItem("token", result.token);
      }
      if (result.access) {
        localStorage.setItem("access_token", result.access);
        localStorage.setItem("refresh_token", result.refresh || "");
      }

      // ✅ روح للـ Home بعد التسجيل الناجح
      navigate("/home");

    } catch (err) {
      setApiError("Network error. Please check your connection and try again.");
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background px-4 py-8 md:p-20">
      <Header hideSignup={true} />

      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <Link to="/Signup" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to role selection</span>
          </Link>

          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-blue-200 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
              <img
                src="/images/slogin.png"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center">
              LET'S GET STARTED
            </h1>
            <p className="text-primary font-semibold mb-6 md:mb-8 text-center">SIGN UP</p>

            {/* API Error Message */}
            {apiError && (
              <div className="w-full max-w-2xl mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {apiError}
              </div>
            )}

            {/* FORM */}
            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* First name */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1 text-left">{errors.firstName}</p>}
                </div>

                {/* Last name */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1 text-left">{errors.lastName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@mail.com"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1 text-left">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    Phone number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="012 3456 789"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1 text-left">{errors.phone}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1 text-left">{errors.password}</p>}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 disabled:opacity-60 ${
                      errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 text-left">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Upload image */}
              <div className="mb-6">
                <label className="block text-left text-sm text-gray-600 mb-2">
                  Upload Profile Image <span className="text-red-500">*</span>
                </label>

                <label className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center ${
                  errors.profileImage ? "border-red-400" : "border-gray-300"
                }`}>
                  {formData.profileImage ? (
                    <>
                      <CheckCircle className="w-7 h-7 text-green-500 mb-2" />
                      <span className="text-sm text-green-600 font-medium">{formData.profileImage.name}</span>
                      <span className="text-xs text-gray-400 mt-1">Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 md:w-8 md:h-8 text-blue-500 mb-2" />
                      <span className="text-sm text-gray-600">Click or drag and drop</span>
                      <span className="text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 3MB)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isLoading} />
                </label>

                {errors.profileImage && <p className="text-red-500 text-sm mt-1 text-left">{errors.profileImage}</p>}
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>

              <p className="text-center mt-4 text-sm text-gray-600">
                <span className="text-blue-500">Already Have An Account?</span>{" "}
                <Link to="/Login" className="text-gray-800 font-semibold hover:text-blue-600">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}