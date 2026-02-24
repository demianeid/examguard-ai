// import React, { useState } from "react";
// import { ArrowLeft, Upload, FileCheck } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import Header from "../components/Header";
// import { Link } from "react-router-dom";
// import axios, { AxiosError } from "axios";

// interface DjangoErrorData {
//   [key: string]: string[];
// }

// export default function ProfessorSignup() {
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//     profileImage: null as File | null,
//     identityCard: null as File | null,
//   });

//   const [errors, setErrors] = useState<{ [key: string]: string }>({});
//   const [loading, setLoading] = useState(false);
//   const [serverError, setServerError] = useState("");
//   const navigate = useNavigate();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleFileUpload = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     field: "profileImage" | "identityCard"
//   ) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       const validTypes = ["image/png", "image/jpeg", "image/jpg"];

//       if (!validTypes.includes(file.type)) {
//         setErrors({ ...errors, [field]: "Invalid file type. Only JPG/PNG allowed." });
//         return;
//       }
//       if (file.size > 5 * 1024 * 1024) {
//         setErrors({ ...errors, [field]: "File size exceeds 5MB." });
//         return;
//       }

//       setErrors({ ...errors, [field]: "" });
//       setFormData({ ...formData, [field]: file });
//     }
//   };

//   const validate = () => {
//     const newErrors: { [key: string]: string } = {};

//     if (!formData.firstName.trim()) newErrors.firstName = "First name is required.";
//     if (!formData.lastName.trim()) newErrors.lastName = "Last name is required.";

//     if (!formData.email.trim()) newErrors.email = "Email is required.";
//     else if (!/\S+@\S+\.\S+/.test(formData.email))
//       newErrors.email = "Invalid email address.";

//     if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
//     else if (!/^\d{10,15}$/.test(formData.phone.replace(/\s+/g, "")))
//       newErrors.phone = "Invalid phone number.";

//     if (!formData.password) newErrors.password = "Password is required.";
//     else if (formData.password.length < 6)
//       newErrors.password = "Password must be at least 6 characters.";

//     if (formData.confirmPassword !== formData.password)
//       newErrors.confirmPassword = "Passwords do not match.";

//     if (!formData.profileImage) newErrors.profileImage = "Profile photo is required.";
//     if (!formData.identityCard)
//       newErrors.identityCard = "Identity card image is required for verification.";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validate()) return;

//     setLoading(true);
//     setServerError("");

//     const data = new FormData();
//     data.append("first_name", formData.firstName);
//     data.append("last_name", formData.lastName);
//     data.append("real_email", formData.email);
//     data.append("phone_number", formData.phone);
//     data.append("password", formData.password);
//     if (formData.profileImage) data.append("profile_image", formData.profileImage);
//     if (formData.identityCard) data.append("identity_card", formData.identityCard);

//     try {
//       await axios.post("http://127.0.0.1:8000/api/auth/register/professor/", data, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       navigate("/Login");
//     } catch (err: unknown) {
//       const axiosError = err as AxiosError<DjangoErrorData>;
//       const errorData = axiosError.response?.data;
//       setServerError(
//         errorData
//           ? Object.values(errorData)[0][0]
//           : "Registration failed. Try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-background px-4 py-8 md:p-20">
//       <Header hideSignup={true} />

//       <div className="min-h-screen bg-background px-4 py-6 md:px-8">
//         {/* Main content card */}
//         <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">

//           <Link
//             to="/Signup"
//             className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             <span className="text-sm">Back to role selection</span>
//           </Link>

//           <div className="flex flex-col items-center">
//             {/* Avatar */}
//             <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-blue-200 flex items-center justify-center mb-4 shadow-lg">
//               <img
//                 src="/images/ilogin.png"
//                 alt="Avatar"
//                 className="w-full h-full rounded-full object-cover"
//               />
//             </div>

//             <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center">
//               LET'S GET STARTED
//             </h1>
//             <p className="text-primary font-semibold mb-6 md:mb-8 text-center">
//               PROFESSOR SIGN UP
//             </p>

//             {/* Server Error */}
//             {serverError && (
//               <div className="w-full max-w-2xl mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm text-center">
//                 {serverError}
//               </div>
//             )}

//             {/* FORM */}
//             <div className="w-full max-w-2xl">

//               {/* Grid 1 col on phones, 2 cols on desktop */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

//                 {/* First name */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     First name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     name="firstName"
//                     value={formData.firstName}
//                     onChange={handleChange}
//                     placeholder="John"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.firstName
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.firstName && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.firstName}</p>
//                   )}
//                 </div>

//                 {/* Last name */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     Last name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     name="lastName"
//                     value={formData.lastName}
//                     onChange={handleChange}
//                     placeholder="Doe"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.lastName
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.lastName && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.lastName}</p>
//                   )}
//                 </div>

//                 {/* Email */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     Email <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder="example@mail.com"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.email
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.email && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.email}</p>
//                   )}
//                 </div>

//                 {/* Phone */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     Phone number <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="tel"
//                     name="phone"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     placeholder="012 3456 789"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.phone
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.phone && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.phone}</p>
//                   )}
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     Password <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.password
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.password && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.password}</p>
//                   )}
//                 </div>

//                 {/* Confirm Password */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-1">
//                     Confirm Password <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="••••••••"
//                     className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${
//                       errors.confirmPassword
//                         ? "border-red-500 focus:ring-red-500"
//                         : "border-gray-200 focus:ring-blue-500"
//                     }`}
//                   />
//                   {errors.confirmPassword && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.confirmPassword}</p>
//                   )}
//                 </div>

//               </div>

//               {/* Upload Section — 2 columns on desktop, 1 on mobile */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

//                 {/* Profile Image Upload */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-2">
//                     Upload Profile Image <span className="text-red-500">*</span>
//                   </label>
//                   <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center">
//                     <Upload className="w-7 h-7 md:w-8 md:h-8 text-blue-500 mb-2" />
//                     <span className="text-sm text-gray-600">
//                       {formData.profileImage
//                         ? formData.profileImage.name
//                         : "Click or drag and drop"}
//                     </span>
//                     <span className="text-xs text-gray-400">PNG, JPG (max. 5MB)</span>
//                     <input
//                       type="file"
//                       accept="image/png, image/jpeg, image/jpg"
//                       className="hidden"
//                       onChange={(e) => handleFileUpload(e, "profileImage")}
//                     />
//                   </label>
//                   {errors.profileImage && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.profileImage}</p>
//                   )}
//                 </div>

//                 {/* Identity Card Upload */}
//                 <div>
//                   <label className="block text-left text-sm text-gray-600 mb-2">
//                     Faculty ID (Karnieh) <span className="text-red-500">*</span>
//                   </label>
//                   <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center">
//                     <FileCheck className="w-7 h-7 md:w-8 md:h-8 text-blue-500 mb-2" />
//                     <span className="text-sm text-gray-600">
//                       {formData.identityCard
//                         ? formData.identityCard.name
//                         : "Click or drag and drop"}
//                     </span>
//                     <span className="text-xs text-gray-400">PNG, JPG (max. 5MB)</span>
//                     <input
//                       type="file"
//                       accept="image/png, image/jpeg, image/jpg"
//                       className="hidden"
//                       onChange={(e) => handleFileUpload(e, "identityCard")}
//                     />
//                   </label>
//                   {errors.identityCard && (
//                     <p className="text-red-500 text-sm mt-1 text-left">{errors.identityCard}</p>
//                   )}
//                 </div>

//               </div>

//               {/* Submit button */}
//               <button
//                 onClick={handleSubmit}
//                 disabled={loading}
//                 className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
//               >
//                 {loading ? "Processing..." : "Sign Up"}
//               </button>

//               {/* Already have account */}
//               <p className="text-center mt-4 text-sm text-gray-600">
//                 <span className="text-blue-500">Already Have An Account?</span>{" "}
//                 <Link
//                   to="/Login"
//                   className="text-gray-800 font-semibold hover:text-blue-600"
//                 >
//                   Sign In
//                 </Link>
//               </p>

//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }






import React, { useState } from "react";
import { ArrowLeft, Upload, FileCheck, CheckCircle } from "lucide-react";
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

      // ✅ عمل Preview
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
    if (!formData.identityCard) newErrors.identityCard = "Identity card image is required for verification.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    const data = new FormData();
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("real_email", formData.email);
    data.append("phone_number", formData.phone);
    data.append("password", formData.password);
    if (formData.profileImage) data.append("profile_image", formData.profileImage);
    if (formData.identityCard) data.append("identity_card", formData.identityCard);

    try {
      await axios.post("http://127.0.0.1:8000/api/auth/register/professor/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<DjangoErrorData>;
      const errorData = axiosError.response?.data;
      setServerError(
        errorData ? Object.values(errorData)[0][0] : "Registration failed. Try again."
      );
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
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center"
          >
            {/* صورة البروفايل لو متحملة */}
            {profilePreview ? (
              <img src={profilePreview} alt="Profile" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-green-200 shadow" />
            ) : (
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Your account is currently <strong>under review</strong> by our administration team.
              You will receive a confirmation email within <strong>24–48 hours</strong> once approved.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6 space-y-2 text-sm text-gray-600">
              <p>📧 <strong>Email sent to:</strong> {formData.email}</p>
              <p>⚖️ <strong>Status:</strong> Pending Verification</p>
              <p>⏱️ <strong>Review time:</strong> 24–48 hours</p>
            </div>

            <button
              onClick={() => navigate("/Login")}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
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

          <Link to="/Signup" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to role selection</span>
          </Link>

          <div className="flex flex-col items-center">

            {/* ✅ Avatar — بيتغير لما يرفع صورة */}
            <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-blue-200 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
              <img
                src={profilePreview || "/images/ilogin.png"}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 text-center">LET'S GET STARTED</h1>
            <p className="text-primary font-semibold mb-6 md:mb-8 text-center">PROFESSOR SIGN UP</p>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-2xl mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm text-center"
                >
                  {serverError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">First name <span className="text-red-500">*</span></label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1 text-left">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Last name <span className="text-red-500">*</span></label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1 text-left">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@mail.com"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.email && <p className="text-red-500 text-sm mt-1 text-left">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Phone number <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="012 3456 789"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.phone && <p className="text-red-500 text-sm mt-1 text-left">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.password && <p className="text-red-500 text-sm mt-1 text-left">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-left text-sm text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 ${errors.confirmPassword ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"}`} />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 text-left">{errors.confirmPassword}</p>}
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                {/* Profile Image Upload */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-2">Upload Profile Image <span className="text-red-500">*</span></label>
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center min-h-[140px]">
                    <Upload className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.profileImage ? formData.profileImage.name : "Click or drag and drop"}
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG (max. 5MB)</span>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileUpload(e, "profileImage")} />
                  </label>
                  {errors.profileImage && <p className="text-red-500 text-sm mt-1 text-left">{errors.profileImage}</p>}
                </div>

                {/* Identity Card Upload */}
                <div>
                  <label className="block text-left text-sm text-gray-600 mb-2">Faculty ID (Karnieh) <span className="text-red-500">*</span></label>
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center min-h-[140px]">
                    <FileCheck className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm text-gray-600">
                      {formData.identityCard ? formData.identityCard.name : "Click or drag and drop"}
                    </span>
                    <span className="text-xs text-gray-400">PNG, JPG (max. 5MB)</span>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => handleFileUpload(e, "identityCard")} />
                  </label>
                  {errors.identityCard && <p className="text-red-500 text-sm mt-1 text-left">{errors.identityCard}</p>}
                </div>

              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Sign Up"}
              </button>

              <p className="text-center mt-4 text-sm text-gray-600">
                <span className="text-blue-500">Already Have An Account?</span>{" "}
                <Link to="/Login" className="text-gray-800 font-semibold hover:text-blue-600">Sign In</Link>
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}