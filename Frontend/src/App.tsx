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
import ExamResults from "./pages/ExamResults";
import StartExam from "./pages/StartExam";
import Settings from "./pages/Setting";
import AccountStudentInstructorView from "./pages/AccountStudentInstructorView";
import EditExam from './pages/EditExam';
import ReviewIncidents from "./pages/ReviewIncidents";
import LiveProctoring from "./pages/LiveProctoring";
import OfflineMode from "./pages/OfflineMode";
import Roi from "./pages/Roi";
import MonitoringOffline from "./pages/MonitoringOffline";
import CreateClass from "./pages/CreateClass";

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/Signup" element={<Signup />} />
      <Route path="/signup/student" element={<StudentSignup />} />
      <Route path="/signup/instructor" element={<Instructorsignup />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/ForgetPassword" element={<ForgetPassword />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/contact" element={<Contact />} />

      {/* Student Routes */}
      <Route path="/home" element={<HomeRegistered />} />
      <Route path="/account-student" element={<AccountStudent />} />
      <Route path="/classes" element={<ClassesStudent />}>
        <Route path=":classId" element={<ClassesStudent />}>
          <Route path=":tab" element={<ClassesStudent />} />
        </Route>
      </Route>
      <Route path="/StartExam" element={<StartExam />} />

      {/* Instructor Routes */}
      <Route path="/home-instructor" element={<HomeRegisteredInstructor />} />
      <Route path="/account-instructor" element={<AccountInstructor />} />
      
      {/* دي الصفحة اللي Login هيحول الدكتور ليها لو is_active: false */}
      <Route path="/classes-instructor" element={<ClassesInstructor />} />
      <Route path="/classes-instructor/:classId/:tab" element={<ClassesInstructor />} />
      
      <Route path="/create-class" element={<CreateClass />} />
      <Route path="/instructor/student-profile/:studentId" element={<AccountStudentInstructorView />} />
      <Route path="/CreateExam" element={<CreateExam />} />
      <Route path="/edit-exam/:examId" element={<EditExam />} />
      <Route path="/exam-results/:examId" element={<ExamResults />} />
      <Route path="/review-incidents" element={<ReviewIncidents />} />
      <Route path="/live-proctoring" element={<LiveProctoring />} />

      {/* Other Tools */}
      <Route path="/settings" element={<Settings />} />
      <Route path="/OfflineMode" element={<OfflineMode />} />
      <Route path="/Roi" element={<Roi />} />
      <Route path="/MonitoringOffline" element={<MonitoringOffline />} />
    </Routes>
  );
}

export default App;