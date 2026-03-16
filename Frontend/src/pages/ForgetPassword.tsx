import { ArrowLeft, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function ForgetPassword() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"email" | "otp" | "newPassword">("email");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const navigate = useNavigate();

  useEffect(() => {
    if (step === "otp") {
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendCode = async (): Promise<void> => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    // http://127.0.0.1:8000
    try {
      await axios.post("https://examguard-ai-production.up.railway.app/api/auth/forget-password/", { email });
      setStep("otp");
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.response?.data?.error || "Email not registered in our system.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (): void => {
    if (step === "newPassword") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } else if (step === "otp") {
      setStep("email");
      setCode(['', '', '', '', '', '']);
      setError("");
    } else {
      navigate(-1);
    }
  };

  const handleChange = (index: number, value: string): void => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleConfirmOtp = async (): Promise<void> => {
    if (code.join('').length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    // http://127.0.0.1:8000
    try {
      await axios.post("https://examguard-ai-production.up.railway.app/api/auth/verify-otp/", {
        email,
        otp: code.join('')
      });
      setStep("newPassword");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setLoading(true);
    // http://127.0.0.1:8000
    try {
      await axios.post("https://examguard-ai-production.up.railway.app/api/auth/reset-password/", {
        email,
        otp: code.join(''),
        new_password: newPassword
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/Login");
      }, 2500);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string): string => {
    const [user, domain] = email.split('@');
    return user.slice(0, 3) + '****@' + domain;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">

      {/* ✅ Custom Success Alert */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-4 border border-green-100"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-500 w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Password Updated!</p>
              <p className="text-gray-500 text-sm">Redirecting you to login...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8"
      >

        {/* Back Header */}
        <div className="flex items-center mb-6">
          <button onClick={handleBack} className="flex items-center text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">
              {step === "email" ? "Forget Password" : step === "otp" ? "Verification Code" : "New Password"}
            </span>
          </button>
        </div>

        {/* Top Image */}
        <div className="w-full flex justify-center mb-8">
          <img src="images/forget.png" alt="Forgot Password" className="w-40 h-40 object-contain" />
        </div>

        {/* ==================== EMAIL STEP ==================== */}
        {step === "email" && (
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              Please write your personal email to receive a confirmation code to set a new password.
            </p>
            <div className="w-full max-w-md">
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    error ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="name@gmail.com"
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="w-full bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:bg-gray-400"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          </div>
        )}

        {/* ==================== OTP STEP ==================== */}
        {step === "otp" && (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Verify Email</h2>
            <p className="text-gray-500 text-center mb-8">
              Verification Code Sent To <span className="text-blue-600 font-medium">{maskEmail(email)}</span>
            </p>

            <div className="flex gap-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>}

            <button
              onClick={handleConfirmOtp}
              disabled={loading}
              className="w-full max-w-md bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg mb-4 disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Confirm Code"}
            </button>

            <div className="text-center">
              <span className={`font-mono font-semibold ${timer < 10 ? 'text-red-500' : 'text-gray-900'}`}>
                00:{timer.toString().padStart(2, '0')}
              </span>
              <button
                onClick={handleSendCode}
                disabled={timer > 0 || loading}
                className={`ml-2 ${timer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 cursor-pointer'}`}
              >
                Resend Confirmation Code
              </button>
            </div>
          </div>
        )}

        {/* ==================== NEW PASSWORD STEP ==================== */}
        {step === "newPassword" && (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">New Password</h2>
            <p className="text-gray-600 text-center mb-8">Please write your new password.</p>

            <div className="w-full max-w-md space-y-4">
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your new password"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your new password"
                />
              </div>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:bg-gray-400"
              >
                {loading ? "Updating..." : "Change Your Password"}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}