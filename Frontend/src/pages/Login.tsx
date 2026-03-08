import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";

interface LoginError {
  detail?: string;
  non_field_errors?: string[];
}

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (!formData.password.trim())
      newErrors.password = "Password is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", {
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      const { access, refresh, user_role, name, student_id, professor_id } = response.data;
      console.log("📦 Full Response:", response.data);
console.log("🔍 Response keys:", Object.keys(response.data));
console.log("🎭 user_role:", response.data.user_role);
console.log("🎭 role:", response.data.role);
console.log("👤 user object:", response.data.user);
     localStorage.setItem("access_token", access);
      localStorage.setItem("refresh", refresh);
      
      localStorage.setItem("role", user_role);
      localStorage.setItem("userName", name);

      if (user_role === "student") {
        localStorage.setItem("userId", student_id);
        navigate("/home");
      } else if (user_role === "professor") {
        localStorage.setItem("userId", professor_id);
        navigate("/home-instructor");
      } else {
        navigate("/");
      }

    } catch (err: unknown) {
      const axiosError = err as AxiosError<LoginError>;
      const message =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.non_field_errors?.[0] ||
        "Invalid email or password.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background lg:p-20 p-4">
      <Header hideLogin={true} />

      <div className="min-h-screen pt-20 bg-background lg:p-8 p-4 flex justify-center items-start">

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xl lg:p-10 p-6"
        >

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center mb-6"
          >
            <div className="lg:w-48 lg:h-48 w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-lg overflow-hidden border-4 border-white">
              <img
                src="/images/signin.png"
                alt="Login Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="lg:text-3xl text-xl font-bold text-primary mb-1 text-center">
              WELCOME BACK
            </h1>
            <p className="text-primary font-semibold text-sm lg:text-base">
              SIGN IN
            </p>
          </motion.div>

          {serverError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center text-sm font-medium">
              {serverError}
            </div>
          )}

          <form className="max-w-xl mx-auto" onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1 text-left">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., name2026@examguard.ed"
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 text-sm lg:text-base ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 text-left">{errors.email}</p>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1 text-left">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 text-sm lg:text-base ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 text-left">{errors.password}</p>
              )}
            </div>

            <Link to="/ForgetPassword">
              <p className="text-right text-sm text-blue-600 mb-5 cursor-pointer hover:underline">
                Forget Password?
              </p>
            </Link>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-semibold transition shadow-md text-sm lg:text-base ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-secondary"
              }`}
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>

            <p className="text-center mt-4 text-sm text-gray-600">
              Don't Have An Account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}