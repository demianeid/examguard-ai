import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LayoutDashboard, Crosshair, Building2, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
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
import MonitoringOffline from "./pages/MonitoringOffline";
import CreateClass from "./pages/CreateClass";
import FaceRecognition from './pages/FaceRecognition';
import ProctoringPage from './pages/ProctoringPage';
import HelpCenter from './pages/HelpCenter';
import TermsConditions from './pages/TermsConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FacilitiesPage from './pages/Facilitiespage';
import DashboardPage from './pages/Dashboardpage';
import ROIConfigurationPage from './pages/Roi';
import ExamsPage from './pages/ExamsPage';

function Sidebar() {
  const location = useLocation();
  const links = [
    { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/facilites", icon: <Building2 size={18} />, label: "Facilities" },
    { to: "/exams", icon: <FileText size={18} />, label: "Exams" },
  ];

  return (
    <aside
      style={{
        width: 260,
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #e5e7eb" }}>
        <Link to="/home-instructor" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img 
            src="/images/logo1.png"
            alt="ExamGuard" 
            style={{ height: "36px", width: "auto", objectFit: "contain" }}
          />
        </Link>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 4,
                background: active ? "#3b82f6" : "transparent",
                color: active ? "#fff" : "#6b7280",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          AD
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Admin User</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>System Administrator</div>
        </div>
      </div>
    </aside>
  );
}

// ==================== MainLayout Component ====================
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar />
      <div style={{ marginLeft: 260, flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public Routes (without Sidebar) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/Signup" element={<Signup />} />
      <Route path="/signup/student" element={<StudentSignup />} />
      <Route path="/signup/instructor" element={<Instructorsignup />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/ForgetPassword" element={<ForgetPassword />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/contact" element={<Contact />} />

      {/* Student Routes (without Sidebar) */}
      <Route path="/home" element={<HomeRegistered />} />
      <Route path="/account-student" element={<AccountStudent />} />
      <Route path="/classes" element={<ClassesStudent />}>
        <Route path=":classId" element={<ClassesStudent />}>
          <Route path=":tab" element={<ClassesStudent />} />
        </Route>
      </Route>
      <Route path="/exam/:examId" element={<StartExam />} />
      <Route path="/StartExam" element={<StartExam />} />

      {/* Instructor Routes (without Sidebar) */}
      <Route path="/home-instructor" element={<HomeRegisteredInstructor />} />
      <Route path="/account-instructor" element={<AccountInstructor />} />
      <Route path="/classes-instructor" element={<ClassesInstructor />} />
      <Route path="/classes-instructor/:classId/:tab" element={<ClassesInstructor />} />
      <Route path="/create-class" element={<CreateClass />} />
      <Route path="/instructor/student-profile/:studentId" element={<AccountStudentInstructorView />} />
      <Route path="/CreateExam" element={<CreateExam />} />
      <Route path="/edit-exam/:examId" element={<EditExam />} />
      <Route path="/exam-results/:examId" element={<ExamResults />} />
      <Route path="/review-incidents" element={<ReviewIncidents />} />
      <Route path="/live-proctoring" element={<LiveProctoring />} />
      <Route path="/proctor/:examId" element={<ProctoringPage />} />

      {/* Other Tools (without Sidebar) */}
      <Route path="/settings" element={<Settings />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/terms-conditions" element={<TermsConditions />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/OfflineMode" element={<OfflineMode />} />
      <Route path="/MonitoringOffline" element={<MonitoringOffline />} />
      <Route path="/FaceRecognition" element={<FaceRecognition />} />

      {/* Routes WITH Sidebar - Wrap them with MainLayout */}
      <Route path="/dashboard" element={
        <MainLayout>
          <DashboardPage />
        </MainLayout>
      } />
      <Route path="/facilites" element={
        <MainLayout>
          <FacilitiesPage />
        </MainLayout>
      } />
      
    
      <Route path="/exams" element={
        <MainLayout>
          <ExamsPage />
        </MainLayout>
      } />
      <Route path="/roi-config/*" element={
        <MainLayout>
          <ROIConfigurationPage />
        </MainLayout>
      } />
      
   
    </Routes>
  );
}

export default App;