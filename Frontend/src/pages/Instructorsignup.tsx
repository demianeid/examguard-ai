
import React, { useState } from "react";
import { ArrowLeft, Upload, FileCheck, CheckCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface DjangoErrorData {
  [key: string]: string[];
}

export default function ProfessorSignup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profileImage: null as File | null,
    identityCard: null as File | null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profileImage" | "identityCard"
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, [field]: "Invalid file type. Only JPG/PNG allowed." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, [field]: "File size exceeds 5MB." });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      if (field === "profileImage") setProfilePreview(previewUrl);
      if (field === "identityCard") setIdentityPreview(previewUrl);

      setErrors({ ...errors, [field]: "" });
      setFormData({ ...formData, [field]: file });
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
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.profileImage) newErrors.profileImage = "Profile photo is required.";
    if (!formData.identityCard) newErrors.identityCard = "Identity card image is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    const data = new FormData();
    // ✅ Updated keys to match Django BaseUser & ProfessorProfile
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("email", formData.email); // Changed from real_email
    data.append("phone_number", formData.phone);
    data.append("password", formData.password);
    
    if (formData.profileImage) data.append("profile_image", formData.profileImage);
    if (formData.identityCard) data.append("identity_card", formData.identityCard);
// http://127.0.0.1:8000
    try {
      await axios.post("http://127.0.0.1:8000/api/auth/register/professor/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<DjangoErrorData>;
      const errorData = axiosError.response?.data;
      
      // Better error parsing for Django Rest Framework
      if (errorData) {
        const firstKey = Object.keys(errorData)[0];
        const errorMessage = errorData[firstKey][0];
        setServerError(`${firstKey.replace('_', ' ')}: ${errorMessage}`);
      } else {
        setServerError("Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-background px-4 py-8 md:p-20">
        <Header hideSignup={true} />
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center"
          >
            {profilePreview ? (
              <img src={profilePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-green-200 shadow" />
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Your account is currently <strong>under review</strong>.
              Approval usually takes <strong>24–48 hours</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6 space-y-2 text-sm text-gray-600">
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Status:</strong> Pending Verification</p>
            </div>
            <button
              onClick={() => navigate("/Login")}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-blue-700 transition shadow-sm hover:shadow-md active:scale-[0.99]"
            >
              Go to Login
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background px-4 py-8 md:p-20">
      <Header hideSignup={true} />
      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">

          <Link to="/Signup" className="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-800 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to role selection</span>
          </Link>

          <div className="flex flex-col items-center">

            {/* ── Profile Avatar Preview ── */}
            <div className="mb-2">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gray-100 flex items-center justify-center shadow-md overflow-hidden border-4 border-white ring-2 ring-gray-200">
                <img
                  src={profilePreview || "/images/ilogin.png"}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <p className={`text-xs mb-1 font-medium ${profilePreview ? "text-green-600" : "text-gray-400"}`}>
              {profilePreview ? "Profile photo selected" : "Upload your photo in the section below"}
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center uppercase mt-3">
              Let's Get Started
            </h1>
            <p className="text-primary font-semibold mb-8 text-center uppercase text-sm tracking-widest">
              Professor Sign Up
            </p>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-2xl mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-2xl">

              {/* ── Form Fields ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "First name",       name: "firstName",       type: "text",     placeholder: "John",           value: formData.firstName },
                  { label: "Last name",         name: "lastName",        type: "text",     placeholder: "Doe",            value: formData.lastName },
                  { label: "Email",             name: "email",           type: "email",    placeholder: "example@mail.com", value: formData.email },
                  { label: "Phone number",      name: "phone",           type: "tel",      placeholder: "012 3456 789",   value: formData.phone },
                  { label: "Password",          name: "password",        type: "password", placeholder: "••••••••",       value: formData.password },
                  { label: "Confirm Password",  name: "confirmPassword", type: "password", placeholder: "••••••••",       value: formData.confirmPassword },
                ].map(({ label, name, type, placeholder, value }) => (
                  <div key={name}>
                    <label className="block text-left text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {label} *
                    </label>
                    <div className="relative">
                      <input
                        type={name === "password" ? (showPassword ? "text" : "password") : name === "confirmPassword" ? (showConfirmPassword ? "text" : "password") : type}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-all ${
                          (name === "password" || name === "confirmPassword") ? "pr-12" : ""
                        } ${
                          errors[name]
                            ? "border-red-400 focus:ring-red-200 bg-red-50"
                            : "border-gray-200 focus:ring-blue-200 focus:border-blue-400 bg-gray-50 focus:bg-white"
                        }`}
                      />
                      {(name === "password" || name === "confirmPassword") && (
                        <button
                          type="button"
                          onClick={() => name === "password" ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                          {(name === "password" ? showPassword : showConfirmPassword) ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      )}
                    </div>
                    {errors[name] && (
                      <p className="text-red-500 text-xs mt-1 text-left">{errors[name]}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* ── Section Divider ── */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Document Upload</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* ── Profile Photo + Faculty ID Upload (side by side, equal height) ── */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

                {/* ── Profile Photo Upload ── */}
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personal Photo *</p>
                  <p className="text-xs text-gray-400 mb-2">Clear front-facing portrait</p>

                  <label className={`flex-1 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[230px] p-5 ${
                    errors.profileImage
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : profilePreview
                      ? "border-indigo-400 bg-indigo-50/60 hover:border-indigo-500"
                      : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
                  }`}>
                    {profilePreview ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={profilePreview}
                          alt="Profile Preview"
                          className="h-28 w-28 object-cover rounded-full border-4 border-white shadow-md ring-2 ring-indigo-200"
                        />
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="text-xs text-indigo-600 font-medium truncate max-w-[160px]">
                            {formData.profileImage?.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shadow-inner">
                          <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8Z" />
                          </svg>
                        </div>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Click to upload</p>
                          <p className="text-xs text-gray-400 mt-0.5">PNG or JPG · Max 5MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "profileImage")}
                    />
                  </label>

                  {errors.profileImage && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.profileImage}</p>
                  )}
                </div>

                {/* ── Faculty ID Upload ── */}
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Faculty ID Card *</p>
                  <p className="text-xs text-gray-400 mb-2">Official faculty identification document</p>

                  <label className={`flex-1 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[230px] p-5 ${
                    errors.identityCard
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : identityPreview
                      ? "border-blue-400 bg-blue-50/60 hover:border-blue-500"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}>
                    {identityPreview ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={identityPreview}
                          alt="Faculty ID Preview"
                          className="h-28 object-contain rounded-lg border border-blue-200 shadow-sm"
                        />
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-blue-600 font-medium truncate max-w-[160px]">
                            {formData.identityCard?.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        {/* ID card illustration — clean SVG */}
                        <div className="w-40 h-24 border border-gray-200 rounded-xl bg-white shadow-sm flex items-center px-3 gap-3 relative">
                          <div className="w-10 h-12 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                          </div>
                          <div className="flex flex-col gap-1.5 flex-1">
                            <div className="h-1.5 bg-gray-200 rounded-full w-full" />
                            <div className="h-1.5 bg-gray-100 rounded-full w-3/4" />
                            <div className="h-1.5 bg-gray-100 rounded-full w-full" />
                            <div className="h-1.5 bg-gray-100 rounded-full w-2/3" />
                          </div>
                          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gray-200" />
                        </div>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Click to upload</p>
                          <p className="text-xs text-gray-400 mt-0.5">PNG or JPG · Max 5MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "identityCard")}
                    />
                  </label>

                  {errors.identityCard && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.identityCard}</p>
                  )}
                </div>

              </div>

              {/* ── Submit Button ── */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all shadow-sm ${
                  loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : "Sign Up"}
              </button>

              <p className="text-center mt-5 text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/Login" className="text-blue-600 font-semibold hover:underline">
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