import React, { useState } from "react";
import { ArrowLeft, Upload, CheckCircle, XCircle, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import axios, { AxiosError } from "axios";

const BASE_URL = "http://localhost:8000";

interface DjangoErrorData {
  [key: string]: string[];
}

type ValidationStatus = "idle" | "loading" | "success" | "error";

interface ValidationState {
  idCheck:   { status: ValidationStatus; message: string };
  faceCheck: { status: ValidationStatus; message: string };
}

// ─── Helper: File → base64 ────────────────────────────────────────────────────
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Helper: Validate ID card has a face (dummy student_id=0) ────────────────
const validateIdCardHasFace = async (base64Image: string): Promise<boolean> => {
  const response = await fetch(`${BASE_URL}/api/face/register/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ student_id: 0, id_card_image: base64Image }),
  });
  return response.ok;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function StudentSignup() {
  const [formData, setFormData] = useState({
    firstName:       "",
    lastName:        "",
    email:           "",
    phone:           "",
    password:        "",
    confirmPassword: "",
    nationalIdImage: null as File | null,
    profileImage:    null as File | null,
  });

  const [errors,          setErrors]          = useState<{ [key: string]: string }>({});
  const [loading,         setLoading]         = useState(false);
  const [serverError,     setServerError]     = useState("");
  const [validationState, setValidationState] = useState<ValidationState>({
    idCheck:   { status: "idle", message: "" },
    faceCheck: { status: "idle", message: "" },
  });

  // هل الـ validation اتعمل بنجاح (بيتحكم في شكل الـ panel بس — مش بيمنع الـ submit)
  const [validationDone, setValidationDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Reset validation لما الـ ID image تتغير
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "nationalIdImage" | "profileImage"
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setErrors(prev => ({ ...prev, [field]: "Invalid file type. Please use PNG or JPG." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [field]: "File size exceeds 5MB." }));
      return;
    }

    setErrors(prev => ({ ...prev, [field]: "" }));
    setFormData(prev => ({ ...prev, [field]: file }));

    // reset validation لو غيّر صورة الـ ID
    if (field === "nationalIdImage") {
      setValidationDone(false);
      setValidationState({
        idCheck:   { status: "idle", message: "" },
        faceCheck: { status: "idle", message: "" },
      });
    }
  };

  // ─── Validate form fields only ────────────────────────────────────────────
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.firstName.trim())                     errs.firstName       = "First name is required.";
    if (!formData.lastName.trim())                      errs.lastName        = "Last name is required.";
    if (!formData.email.trim())                         errs.email           = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))     errs.email           = "Invalid email address.";
    if (!formData.phone.trim())                         errs.phone           = "Phone number is required.";
    if (!formData.password)                             errs.password        = "Password is required.";
    else if (formData.password.length < 6)              errs.password        = "Min 6 characters.";
    if (formData.confirmPassword !== formData.password) errs.confirmPassword = "Passwords do not match.";
    if (!formData.profileImage)                         errs.profileImage    = "Personal photo is required.";
    if (!formData.nationalIdImage)                      errs.nationalIdImage = "National ID image is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Main handler: Verify ID → Register → Save Embedding ─────────────────
  const handleSubmit = async () => {
    // 1) Validate form
    if (!validateForm()) return;

    setLoading(true);
    setServerError("");

    const base64 = await fileToBase64(formData.nationalIdImage!);

    // 2) Verify National ID (step-by-step UI feedback)
    setValidationState({
      idCheck:   { status: "loading", message: "Checking National ID image..." },
      faceCheck: { status: "loading", message: "Detecting face in ID..." },
    });

    let hasFace = false;
    try {
      hasFace = await validateIdCardHasFace(base64);
    } catch {
      setValidationState({
        idCheck:   { status: "error", message: "Could not connect to server. Please try again." },
        faceCheck: { status: "idle",  message: "" },
      });
      setLoading(false);
      return;
    }

    if (!hasFace) {
      setValidationState({
        idCheck:   { status: "error", message: "The uploaded image is not a valid National ID." },
        faceCheck: { status: "error", message: "Please upload a clear front-side National ID." },
      });
      setLoading(false);
      return;
    }

    setValidationState({
      idCheck:   { status: "success", message: "ID image accepted ✓" },
      faceCheck: { status: "success", message: "Face detected successfully ✓" },
    });
    setValidationDone(true);

    // 3) Register student account
    const data = new FormData();
    data.append("first_name",   formData.firstName);
    data.append("last_name",    formData.lastName);
    data.append("email",        formData.email);
    data.append("phone_number", formData.phone);
    data.append("password",     formData.password);
    data.append("role",         "student");
    if (formData.profileImage) data.append("profile_image", formData.profileImage);

    let studentId: number | null = null;

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register/student/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      studentId = res.data?.data?.id ?? null;
    } catch (err: unknown) {
      const axiosError = err as AxiosError<DjangoErrorData>;
      const errorData  = axiosError.response?.data;
      let message = "Registration failed. Please try again.";
      if (errorData) {
        const key = Object.keys(errorData)[0];
        const val = errorData[key];
        message   = `${key}: ${Array.isArray(val) ? val[0] : val}`;
      }
      setServerError(message);
      setLoading(false);
      return;
    }

    // 4) Save face embedding with the real student id
    if (studentId) {
      try {
        await fetch(`${BASE_URL}/api/face/register/`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ student_id: studentId, id_card_image: base64 }),
        });
      } catch {
        console.warn("Face embedding save failed — student registered but face not saved.");
      }
    }

    setLoading(false);
    navigate("/Login");
  };

  // ─── ValidationStep UI component ─────────────────────────────────────────
  const ValidationStep = ({
    label, status, message,
  }: { label: string; status: ValidationStatus; message: string }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex-shrink-0">
        {status === "idle"    && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
        {status === "loading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
        {status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
        {status === "error"   && <XCircle className="w-5 h-5 text-red-500" />}
      </div>
      <div>
        <p className={`text-sm font-medium ${
          status === "idle"    ? "text-gray-400"  :
          status === "loading" ? "text-blue-600"  :
          status === "success" ? "text-green-700" : "text-red-600"
        }`}>{label}</p>
        {message && (
          <p className={`text-xs mt-0.5 ${
            status === "success" ? "text-green-600" : "text-red-500"
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );

  const anyLoading  = loading || Object.values(validationState).some(v => v.status === "loading");
  const hasError    = Object.values(validationState).some(v => v.status === "error");
  const idImageURL  = formData.nationalIdImage ? URL.createObjectURL(formData.nationalIdImage) : null;
  const profileURL  = formData.profileImage    ? URL.createObjectURL(formData.profileImage)    : null;

  // Label for the submit button depending on current state
  const buttonLabel = () => {
    if (loading) {
      const loadingStep =
        validationState.idCheck.status === "loading" ? "Verifying ID..." :
        validationState.faceCheck.status === "loading" ? "Detecting Face..." :
        "Creating Account...";
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {loadingStep}
        </span>
      );
    }
    return "SIGN UP";
  };

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
                {profileURL
                  ? <img src={profileURL} alt="Profile" className="w-full h-full object-cover" />
                  : <img src="/images/slogin.png" alt="Avatar" className="w-full h-full object-cover" />
                }
              </div>
            </div>
            <p className={`text-xs mb-1 font-medium ${profileURL ? "text-green-600" : "text-gray-400"}`}>
              {profileURL ? "Profile photo selected" : "Upload your photo in the section below"}
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center uppercase mt-3">
              Let's Get Started
            </h1>
            <p className="text-primary font-semibold mb-8 text-center uppercase text-sm tracking-widest">
              Student Sign Up
            </p>

            {serverError && (
              <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-center text-sm">
                {serverError}
              </div>
            )}

            <div className="w-full max-w-2xl">

              {/* ── Form Fields ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  { label: "First name",       name: "firstName",       type: "text",     placeholder: "John" },
                  { label: "Last name",         name: "lastName",        type: "text",     placeholder: "Doe" },
                  { label: "Email",             name: "email",           type: "email",    placeholder: "example@mail.com" },
                  { label: "Phone",             name: "phone",           type: "tel",      placeholder: "0123456789" },
                  { label: "Password",          name: "password",        type: "password", placeholder: "••••••••" },
                  { label: "Confirm Password",  name: "confirmPassword", type: "password", placeholder: "••••••••" },
                ].map(({ label, name, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-left text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label} *</label>
                    <div className="relative">
                      <input
                        type={name === "password" ? (showPassword ? "text" : "password") : name === "confirmPassword" ? (showConfirmPassword ? "text" : "password") : type}
                        name={name}
                        placeholder={placeholder}
                        value={formData[name as keyof typeof formData] as string}
                        onChange={handleChange}
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

              {/* ── National ID + Profile Photo Upload (side by side, equal height) ── */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

                {/* ── National ID Upload ── */}
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">National ID Card *</p>
                  <p className="text-xs text-gray-400 mb-2">Front side only — used for face verification</p>

                  <label className={`flex-1 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[230px] p-5 ${
                    errors.nationalIdImage
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : idImageURL
                      ? "border-blue-400 bg-blue-50/60 hover:border-blue-500"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}>
                    {idImageURL ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={idImageURL}
                          alt="National ID Preview"
                          className="h-28 object-contain rounded-lg border border-blue-200 shadow-sm"
                        />
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-blue-600 font-medium truncate max-w-[160px]">
                            {formData.nationalIdImage?.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">Click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        {/* ID card illustration — clean SVG, no emoji */}
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
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, "nationalIdImage")}
                    />
                  </label>

                  {errors.nationalIdImage && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.nationalIdImage}</p>
                  )}
                </div>

                {/* ── Profile Photo Upload ── */}
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personal Photo *</p>
                  <p className="text-xs text-gray-400 mb-2">Clear front-facing portrait</p>

                  <label className={`flex-1 border-2 border-dashed rounded-xl cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 min-h-[230px] p-5 ${
                    errors.profileImage
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : profileURL
                      ? "border-indigo-400 bg-indigo-50/60 hover:border-indigo-500"
                      : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
                  }`}>
                    {profileURL ? (
                      <div className="flex flex-col items-center gap-2.5 w-full">
                        <img
                          src={profileURL}
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
                        {/* Person portrait — clean SVG, no emoji */}
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
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={e => handleImageUpload(e, "profileImage")}
                    />
                  </label>

                  {errors.profileImage && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.profileImage}</p>
                  )}
                </div>

              </div>

              {/* ── Validation Panel ── */}
              {formData.nationalIdImage && (
                <div className={`mb-6 border rounded-xl p-4 transition-all ${
                  validationDone
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">ID Verification Status</h3>
                    {validationDone && (
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-200">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    <ValidationStep label="Step 1 — National ID Check" {...validationState.idCheck} />
                    <ValidationStep label="Step 2 — Face Detection"    {...validationState.faceCheck} />
                  </div>

                  {hasError && !loading && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Verification failed. Please fix the errors above and try again.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Submit Button ── */}
              <button
                onClick={handleSubmit}
                disabled={anyLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all shadow-sm ${
                  anyLoading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-[0.99]"
                }`}
              >
                {buttonLabel()}
              </button>

              <p className="text-center mt-4 text-sm text-gray-600">
                Already Have An Account?{" "}
                <Link to="/Login" className="text-blue-600 font-bold hover:underline">
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