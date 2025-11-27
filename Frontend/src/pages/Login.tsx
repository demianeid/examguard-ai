import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email address.";

    if (!formData.password.trim())
      newErrors.password = "Password is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Login submitted:", formData);
    alert("Login successful!");
  };

  return (
    <div className="bg-background lg:p-20  p-4">
      <Header hideLogin={true} />

      <div className="min-h-screen pt-20 bg-background lg:p-8 p-4 flex justify-center items-start">
        
        {/* Container Animation */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xl lg:p-10 p-6"
        >

          {/* Avatar Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center mb-6"
          >
            <div className="lg:w-50 lg:h-50 w-32 h-32 rounded-full bg-blue-200 flex items-center justify-center mb-4 shadow-lg">
              <img
                src="/images/signin.png"
                alt="Avatar"
                className="lg:w-40 lg:h-40 w-24 h-24 rounded-full object-cover"
              />
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:text-3xl text-xl font-bold text-primary mb-1 text-center"
            >
              WELCOME BACK
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-primary font-semibold text-sm lg:text-base"
            >
              SIGN IN
            </motion.p>
          </motion.div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-xl mx-auto"
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm text-gray-600 mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g., name2026@exam.edu"
                className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 text-sm lg:text-base ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-200 focus:ring-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-sm text-gray-600 mb-1">
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
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Forget Password */}
            <Link to="/ForgetPassword">
              <p className="text-right text-sm text-blue-600 mb-5 cursor-pointer hover:underline">
                Forget Password?
              </p>
            </Link>

            {/* Login Button */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-secondary transition shadow-md text-sm lg:text-base"
            >
              SIGN IN
            </button>

            {/* Create Account */}
            <p className="text-center mt-4 text-sm text-gray-600">
              Don't Have An Account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </span>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}