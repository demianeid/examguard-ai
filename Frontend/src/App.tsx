import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
import StudentSignup from "./pages/StudentSignup";
import Instructorsignup from "./pages/Instructorsignup";
import Login from "./pages/Login";
import ForgetPassword from "./pages/ForgetPassword";
import HomeRegisteredInstructor from "./pages/HomeRegisterdInstructor";
import HomeRegistered from "./pages/HomeRegisterd";
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import AccountStudent from './pages/AccountStudent';
import AccountInstructor from './pages/AccountInstructor';


function App() {
  return (
    
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/Signup" element={<Signup />} />
      <Route path="/signup/student" element={<StudentSignup />} />
      <Route path="/signup/instructor" element={<Instructorsignup />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/ForgetPassword" element={<ForgetPassword />} /> 
      <Route path="/home" element={<HomeRegistered />} />
      <Route path="/home-instructor" element={<HomeRegisteredInstructor />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/account-student" element={<AccountStudent />} />
      <Route path="/account-instructor" element={<AccountInstructor />} />
    </Routes>
  );
}

export default App;
