import { ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";


export default function ForgetPassword() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState<number>(29);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null)
  ];

  const navigate = useNavigate();

  useEffect(() => {
    if (step === "otp") {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step]);

  const validatePhone = (): string => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const egyptRegex = /^(010|011|012|015)\d{8}$/;

    if (!cleaned) return "Phone number is required.";
    if (!egyptRegex.test(cleaned)) return "Invalid Egyptian phone number.";

    return "";
  };

  const handleSendCode = (): void => {
    const validationError = validatePhone();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStep("otp");
  };

  const handleBack = (): void => {
    if (step === "newPassword") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } else if (step === "otp") {
      setStep("phone");
      setCode(['', '', '', '']);
      setTimer(29);
    } else {
      navigate(-1);
    }
  };

  const handleChange = (index: number, value: string): void => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleConfirm = (): void => {
    const fullCode = code.join('');
    console.log('Verification code:', fullCode);
    // Handle verification logic here
    // If verification successful, move to new password step
    setStep("newPassword");
  };

  const handleResend = (): void => {
    if (timer === 0) {
      setTimer(29);
      setCode(['', '', '', '']);
      console.log('Resending code...');
      // Handle resend logic here
    }
  };

  const handleChangePassword = (): void => {
    setPasswordError("");

    if (!newPassword) {
      setPasswordError("Password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    console.log('Password changed successfully');
    // Handle password change logic here
    // Navigate to success page or login
  };

  const maskPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return '********' + cleaned.slice(-3);
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-8"
>

        {/* ---------- Back Header ---------- */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">
              {step === "phone" ? "Forget Password" : step === "otp" ? "Verification Code" : "New Password"}
            </span>
          </button>
        </div>

        {/* ---------- Top Image (Design) ---------- */}
        <div className="w-full flex justify-center mb-8">
          <img
            src="images/forget.png"
            alt="Forgot Password"
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* ==================== PHONE STEP ==================== */}
        {step === "phone" && (
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h2>

            <p className="text-gray-600 text-center mb-8 max-w-md">
              Please Write Your Email To Receive A Confirmation Code To Set New Password.
            </p>

            <div className="w-full max-w-md">
              <div className="mb-4">
                <label className="block text-gray-600 text-sm mb-2">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    error
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="e.g. 01012345678"
                />

                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>

              <button
                onClick={handleSendCode}
                className="w-full bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg"
              >
                Send Code
              </button>
            </div>
          </div>
        )}

        {/* ==================== OTP/VERIFICATION CODE STEP ==================== */}
        {step === "otp" && (
          <div className="flex flex-col items-center justify-center py-8">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verify Phone Number
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-center mb-8">
              Verification Code Sent To {maskPhoneNumber(phoneNumber)}
            </p>

            {/* Verification Code Inputs */}
            <div className="flex gap-4 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-16 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={`Verification code digit ${index + 1}`}
                  placeholder="-"
                />
              ))}
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="w-full max-w-md bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg mb-4"
            >
              Confirm Code
            </button>

            {/* Timer and Resend */}
            <div className="text-center">
              <span className="text-gray-900 font-semibold">
                00:{timer.toString().padStart(2, '0')}
              </span>
              <button
                onClick={handleResend}
                disabled={timer > 0}
                className={`ml-2 ${
                  timer > 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700 cursor-pointer'
                }`}
              >
                Resend Confirmation Code
              </button>
            </div>
          </div>
        )}

        {/* ==================== NEW PASSWORD STEP ==================== */}
        {step === "newPassword" && (
          <div className="flex flex-col items-center justify-center py-8">
            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              New Password
            </h2>

            {/* Description */}
            <p className="text-gray-600 text-center mb-8">
              Please Write Your New Password
            </p>

            {/* Password Inputs */}
            <div className="w-full max-w-md space-y-4">
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Your password"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm Your password"
                />
              </div>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}

              <button
                onClick={handleChangePassword}
                className="w-full bg-secondary hover:bg-primary text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Change Your Password
              </button>
            </div>
          </div>
        )}

      </motion.div>

    </div>
  );
}