import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Signup from "./pages/Signup";
import StudentSignup from "./pages/StudentSignup";
import Instructorsignup from "./pages/Instructorsignup";
import Login from "./pages/Login";
import ForgetPassword from "./pages/ForgetPassword";
import HomeRegisteredInstructor from "./pages/HomeRegisterdInstructor";
import HomeRegistered from "./pages/HomeRegisterd";
import Features from "./pages/Features";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import AccountStudent from "./pages/AccountStudent";
import ClassesStudent from "./pages/ClassesStudent";
import ClassesInstructor from "./pages/ClassesInstructor";
import AccountInstructor from "./pages/AccountInstructor";
import CreateExam from "./pages/CreateExam";
import StartExam from "./pages/StartExam";
import Settings from "./pages/Setting";
import AccountStudentInstructorView from "./pages/AccountStudentInstructorView";
function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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
     
    <Route path="/instructor/student-profile/:studentId" element={<AccountStudentInstructorView />} />
      <Route path="/account-instructor" element={<AccountInstructor />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/classes-instructor" element={<ClassesInstructor />} />
       <Route path="/classes-instructor/:classId/:tab" element={<ClassesInstructor />} />
        <Route path="/classes" element={<ClassesStudent />}>
          <Route path=":classId" element={<ClassesStudent />}>
            <Route path=":tab" element={<ClassesStudent />} />
          </Route>
        </Route>      <Route path="/CreateExam" element={<CreateExam />} />
      <Route path="/classes" element={<ClassesStudent />}>
        <Route path=":classId" element={<ClassesStudent />}>
          <Route path=":tab" element={<ClassesStudent />} />
        </Route>
      </Route>{" "}
      <Route path="/CreateExam" element={<CreateExam />} />
      <Route path="StartExam" element={<StartExam />} />
    </Routes>
  );
}

export default App;
