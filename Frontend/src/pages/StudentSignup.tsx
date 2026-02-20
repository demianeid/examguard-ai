

import React, { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Link } from "react-router-dom";
// BACKEND: Axios import for API calls
import axios from "axios";

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
  // BACKEND: Loading and global error states
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim())
      newErrors.lastName = "Last name is required.";

    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email address.";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s+/g, "")))
      newErrors.phone = "Invalid phone number.";

    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!formData.profileImage)
      newErrors.profileImage = "Profile image is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // BACKEND: Updated handleSubmit to work with Django API
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    // BACKEND: Using FormData because we are uploading a file (image)
    const data = new FormData();
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("real_email", formData.email);
    data.append("phone_number", formData.phone);
    data.append("password", formData.password);
    if (formData.profileImage) {
      data.append("profile_image", formData.profileImage);
    }

    try {
      // BACKEND: Make sure this URL matches your Django project
      const response = await axios.post("http://127.0.0.1:8000/api/auth/register/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("BACKEND Success:", response.data);
      // بعد التسجيل الناجح، اذهب إلى صفحة الـ Login أو الـ Home
      navigate("/home");
    } catch (err: any) {
      // BACKEND: Handling errors from Django
      console.error("BACKEND Error:", err.response?.data);
      const message = err.response?.data?.real_email?.[0] || 
                      err.response?.data?.password?.[0] || 
                      "Something went wrong. Please try again.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background px-4 py-8 md:p-20">
      <Header hideSignup={true} />

      <div className="min-h-screen bg-background px-4 py-6 md:px-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <Link
            to="/Signup"
            className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to role selection</span>
          </Link>

          <div className="flex flex-col items-center">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-blue-200 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
              {/* BACKEND: Dynamic preview for the uploaded image */}
              <img
                src={formData.profileImage ? URL.createObjectURL(formData.profileImage) : "/images/slogin.png"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center">
              LET'S GET STARTED
            </h1>
            <p className="text-primary font-semibold mb-6 md:mb-8 text-center">
              SIGN UP
            </p>

            {/* BACKEND: Show server error message if it exists */}
            {serverError && (
              <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-center">
                {serverError}
              </div>
            )}

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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.firstName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.firstName}
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.lastName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.lastName}
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.email}
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.phone}
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.password}
                    </p>
                  )}
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
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1 text-left">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload image */}
              <div className="mb-6">
                <label className="block text-left text-sm text-gray-600 mb-2">
                  Upload Profile Image <span className="text-red-500">*</span>
                </label>

                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center">
                  <Upload className="w-7 h-7 md:w-8 md:h-8 text-blue-500 mb-2" />
                  <span className="text-sm text-gray-600">
                    {formData.profileImage ? formData.profileImage.name : "Click or drag and drop"}
                  </span>
                  <span className="text-xs text-gray-400">
                    SVG, PNG, JPG or GIF (max. 3MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {errors.profileImage && (
                  <p className="text-red-500 text-sm mt-1 text-left">
                    {errors.profileImage}
                  </p>
                )}
              </div>

              {/* BACKEND: Submit button with loading state */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-semibold transition shadow-md ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>

              {/* Already have account */}
              <p className="text-center mt-4 text-sm text-gray-600">
                <span className="text-blue-500">Already Have An Account?</span>{" "}
                <Link
                  to="/Login"
                  className="text-gray-800 font-semibold hover:text-blue-600"
                >
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