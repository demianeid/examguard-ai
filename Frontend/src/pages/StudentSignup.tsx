import React, { useState, useEffect } from "react";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Link } from "react-router-dom";
import axios, { AxiosError } from "axios";

interface DjangoErrorData {
  [key: string]: string[];
}

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
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  // Cleanup object URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (formData.profileImage) {
        URL.revokeObjectURL(URL.createObjectURL(formData.profileImage));
      }
    };
  }, [formData.profileImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];

      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, profileImage: "Invalid file type. Please use PNG or JPG." });
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

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters.";
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.profileImage) newErrors.profileImage = "Profile image is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    const data = new FormData();
    // These keys MUST match your Django Serializer fields exactly
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("email", formData.email); // FIXED: Changed from "Email address"
    data.append("phone_number", formData.phone);
    data.append("password", formData.password);
    data.append("role", "student"); // Good practice to include the role explicitly

    if (formData.profileImage) {
      data.append("profile_image", formData.profileImage);
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/auth/register/student/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/Login");
    } catch (err: unknown) {
      const axiosError = err as AxiosError<DjangoErrorData>;
      const errorData = axiosError.response?.data;
      let message = "Registration failed. Please try again.";

      if (errorData) {
        // Extract the first error message from the dictionary
        const firstErrorKey = Object.keys(errorData)[0];
        const errorVal = errorData[firstErrorKey];
        message = `${firstErrorKey}: ${Array.isArray(errorVal) ? errorVal[0] : errorVal}`;
      }
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
          <Link to="/Signup" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to role selection</span>
          </Link>

          <div className="flex flex-col items-center">
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-lg overflow-hidden border-4 border-white">
              <img
                src={formData.profileImage ? URL.createObjectURL(formData.profileImage) : "/images/slogin.png"}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center uppercase">Let's Get Started</h1>
            <p className="text-primary font-semibold mb-6 md:mb-8 text-center uppercase">Student Sign Up</p>

            {serverError && (
              <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-center text-sm">
                {serverError}
              </div>
            )}

            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">First name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1 text-left">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Last name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1 text-left">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@mail.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.email && <p className="text-red-500 text-xs mt-1 text-left">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Phone *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0123456789"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 text-left">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.password && <p className="text-red-500 text-xs mt-1 text-left">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Confirm Password *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 text-left">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-left text-sm text-gray-600 mb-2 font-medium">Upload Profile Image *</label>
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-500 mb-2" />
                  <span className="text-sm text-gray-600 italic">
                    {formData.profileImage ? formData.profileImage.name : "Click to upload avatar"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {errors.profileImage && <p className="text-red-500 text-xs mt-1 text-left">{errors.profileImage}</p>}
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-bold transition shadow-md ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
              </button>

              <p className="text-center mt-4 text-sm text-gray-600">
                Already Have An Account?{" "}
                <Link to="/Login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}