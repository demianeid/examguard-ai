import { useState, useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { useUser } from '../context/UserContext';

// Logo URLs
const LOGO_URL = "/images/logo1.png"; // Default logo
const SCROLLED_LOGO_URL = "/images/logo2.png"; // Logo for scrolled state

interface HeaderProps {
  hideSignup?: boolean;
  hideLogin?: boolean;
  fixed?: boolean;
  showAccount?: boolean;
  isRegistered?: boolean;
  isAccountPage?: boolean;
  userType?: 'student' | 'instructor';
}

// Type guard للتحقق من أن الـ path مناسب لـ HashLink
const isValidHashLinkPath = (path: string): boolean => {
  return path.startsWith('/#') || path === '/';
};

const Header: React.FC<HeaderProps> = ({ 
  hideSignup = false, 
  hideLogin = false, 
  fixed = false, 
  showAccount = false, 
  isRegistered = false,
  isAccountPage = false,
  userType: propUserType
}) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Safe hook usage with fallback
  let contextUserType: 'student' | 'instructor' = 'student';
  let setUserType: (type: 'student' | 'instructor') => void = () => {};

  try {
    const userContext = useUser();
    contextUserType = userContext.userType;
    setUserType = userContext.setUserType;
  } catch (error) {
    console.warn('UserContext not available, using default values');
  }

  // Use prop userType or context userType
  const userType = propUserType || contextUserType;

  // Auto-detect account pages
  const isAccountPageAuto = location.pathname === "/account-instructor" || 
                           location.pathname === "/account-student";

  // Auto-detect user type from current page
  useEffect(() => {
    if (location.pathname === "/home-instructor" || 
        location.pathname === "/account-instructor" ||
        location.pathname === "/classes-instructor" ||
        location.pathname.startsWith("/classes-instructor/")) {
      setUserType('instructor');
    } else if (location.pathname === "/home" || 
               location.pathname === "/account-student" ||
               location.pathname === "/classes" ||
               location.pathname.startsWith("/classes/")) {
      setUserType('student');
    }
  }, [location.pathname, setUserType]);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      if (current > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine which logo to use based on scroll state
  const currentLogo = isScrolled ? SCROLLED_LOGO_URL : LOGO_URL;

  // Determine paths based on user type
  const getNavPaths = () => {
    if (!isRegistered) {
      return {
        home: "/#home",
        features: "/#features",
        howItWorks: "/#howitworks",
        contact: "/#contact"
      };
    }

    // الـ routes الفعلية حسب نوع المستخدم
    const baseHomePath = userType === 'instructor' ? "/home-instructor" : "/home";
    const classesPath = userType === 'instructor' ? "/classes-instructor" : "/classes";
    
    return {
      home: baseHomePath,
      features: "/features",
      howItWorks: "/how-it-works",
      contact: "/contact",
      classes: classesPath  // هنا الفرق - كل واحد هيروح للصفحة الخاصة بيه
    };
  };

  const paths = getNavPaths();

  // تأكد أن كل الـ paths موجودة وتعطي قيمة افتراضية إذا كانت undefined
  const ensurePath = (path: string | undefined): string => {
    return path || "/";
  };

  // Navigation items based on user status AND user type
  const navItems = isRegistered ? [
    { name: "Home", path: ensurePath(paths.home) },
    { name: "Features", path: ensurePath(paths.features) },
    { name: "How It Works", path: ensurePath(paths.howItWorks) },
    { name: "Contact", path: ensurePath(paths.contact) },
    { name: "Classes", path: ensurePath(paths.classes) }  // هنا الـ path يتغير حسب userType
  ] : [
    { name: "Home", path: ensurePath(paths.home) },
    { name: "Features", path: ensurePath(paths.features) },
    { name: "How It Works", path: ensurePath(paths.howItWorks) },
    { name: "Contact", path: ensurePath(paths.contact) }
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      setUserType('student'); // Reset to default
      navigate("/");
    }
  };

  // Use auto-detected value or prop value
  const finalIsAccountPage = isAccountPage || isAccountPageAuto;

  // Determine home path based on user type
  const getHomePath = (): string => {
    if (!isRegistered) return "/";
    return userType === 'instructor' ? "/home-instructor" : "/home";
  };

  // Determine account path based on user type
  const getAccountPath = (): string => {
    return userType === 'instructor' ? "/account-instructor" : "/account-student";
  };

  // Render navigation link based on type
  const renderNavLink = (item: { name: string; path: string }, isMobile: boolean = false) => {
    const baseClasses = isMobile 
      ? `block text-center px-3.5 py-2 font-semibold transition-colors ${
          isScrolled
            ? "text-white hover:text-blue-200"
            : "text-gray-900 hover:text-blue-600"
        }`
      : `relative px-3.5 py-2 font-semibold transition-colors group ${
          isScrolled ? "text-white" : "text-gray-900"
        }`;

    if (isRegistered) {
      return (
        <Link
          to={item.path}
          className={baseClasses}
          onClick={() => isMobile && setIsMenuOpen(false)}
        >
          {item.name}
          {!isMobile && (
            <span
              className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                isScrolled ? "bg-white" : "bg-blue-600"
              }`}
            ></span>
          )}
        </Link>
      );
    } else {
      // للغير مسجلين، استخدم HashLink فقط للـ paths التي تبدأ بـ /#
      if (isValidHashLinkPath(item.path)) {
        return (
          <HashLink
            smooth
            to={item.path}
            className={baseClasses}
            onClick={() => isMobile && setIsMenuOpen(false)}
          >
            {item.name}
            {!isMobile && (
              <span
                className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? "bg-white" : "bg-blue-600"
                }`}
              ></span>
            )}
          </HashLink>
        );
      } else {
        // إذا كان path مش مناسب لـ HashLink، استخدم Link عادي
        return (
          <Link
            to={item.path}
            className={baseClasses}
            onClick={() => isMobile && setIsMenuOpen(false)}
          >
            {item.name}
            {!isMobile && (
              <span
                className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                  isScrolled ? "bg-primary" : "bg-primary"
                }`}
              ></span>
            )}
          </Link>
        );
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ease-in-out
        ${
          isScrolled
            ? "bg-p1/80 backdrop-blur-md shadow-lg px-5 sm:px-20 py-3" // Added blur and transparency
            : "bg-background px-5 sm:px-20 py-3"
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link
          to={getHomePath()}
          className="flex items-center"
        >
          <img 
            src={currentLogo} // Use dynamic logo based on scroll state
            alt="ExamGuard Logo" 
            className="h-9 sm:h-9 w-auto object-contain transition-all duration-300"
          />
        </Link>

        {/* Right Section - Buttons & Toggle */}
        <div className="flex items-center gap-2 lg:order-2">
          {finalIsAccountPage ? (
            <div className="flex items-center gap-4">
              {/* Settings icon - show on both mobile and desktop */}
              <Link
                to="/settings"
                className={`p-2 font-semibold rounded-lg transition-all ${
                  isScrolled
                    ? "text-white hover:text-gray-300"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* Logout button - only show on desktop */}
              <button
                onClick={handleLogout}
                className={`hidden lg:flex items-center gap-2 px-3 py-2 font-semibold rounded-lg border-2 transition-all ${
                  isScrolled
                    ? "bg-red-400 text-white border-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                    : "bg-transparent text-danger border-danger hover:bg-danger hover:text-white hover:border-danger"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>

              {/* Mobile Toggle - only show on mobile */}
              <button
                className={`lg:hidden ml-2 text-2xl ${
                  isScrolled ? "text-white" : "text-gray-900"
                }`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          ) : showAccount ? (
            <>
              {/* Desktop Account Button */}
              <Link
                to={getAccountPath()}
                className={`hidden lg:flex px-4 py-2 font-semibold rounded-lg border-2 transition-all ${
                  isScrolled
                    ? "bg-transparent text-white border-white/50 hover:bg-white hover:text-primary hover:border-white"
                    : "bg-transparent text-primary border-primary/50 hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                Account
              </Link>

              {/* Mobile Account Icon - Only icon, no text */}
              <Link
                to={getAccountPath()}
                className={`lg:hidden p-2 font-semibold rounded-lg transition-all ${
                  isScrolled
                    ? "text-white hover:text-gray-300"
                    : "text-gray-700 hover:text-gray-900"
                }`}
                title="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Mobile Toggle - only show on mobile */}
              <button
                className={`lg:hidden ml-2 text-2xl ${
                  isScrolled ? "text-white" : "text-gray-900"
                }`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </>
          ) : (
            <>
              {!hideLogin && (
                <Link
                  to="/Login"
                  className={`hidden lg:block px-4 py-2 font-semibold transition-colors ${
                    isScrolled
                      ? "text-white hover:text-blue-200"
                      : "text-gray-900 hover:text-blue-600"
                  }`}
                >
                  Log in
                </Link>
              )}

              {!hideSignup && (
                <Link
                  to="/Signup"
                  className={`px-4 py-2 font-semibold rounded transition-all ${
                    isScrolled
                      ? "bg-white text-blue-600 border border-white hover:bg-transparent hover:text-white"
                      : "bg-primary text-white hover:bg-secondary"
                  }`}
                >
                  Sign up
                </Link>
              )}

              {/* Mobile Toggle - only show on mobile */}
              <button
                className={`lg:hidden ml-2 text-2xl ${
                  isScrolled ? "text-white" : "text-gray-900"
                }`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </>
          )}
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex lg:order-1 text-sm mx-auto">
          <ul className="flex items-center gap-1">
            {navItems.map((item, index) => (
              <li key={index}>
                {renderNavLink(item, false)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? "max-h-96 mt-4" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col items-center gap-2 pb-4">
          {navItems.map((item, index) => (
            <li key={index} className="w-full">
              {renderNavLink(item, true)}
            </li>
          ))}

          {/* إظهار الأزرار المناسبة حسب حالة المستخدم */}
          {isRegistered ? (
            // إذا كان المستخدم مسجل - إظهار زر Logout فقط
            finalIsAccountPage ? (
              <li className="w-full">
                <button
                  onClick={handleLogout}
                  className={`flex items-center justify-center gap-2 px-4 py-2 font-semibold transition-colors w-full border-2 rounded-lg ${
                    isScrolled
                      ? "bg-red-400 text-white border-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                      : "text-danger border-danger hover:bg-red-500 hover:text-white hover:border-red-500"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
            ) : (
              // إذا كان المستخدم مسجل ولكن ليس في صفحة Account - لا نعرض أي أزرار إضافية
              null
            )
          ) : (
            // إذا كان المستخدم غير مسجل - إظهار زر Log in
            !hideLogin && (
              <li className="w-full">
                <Link
                  to="/Login"
                  className={`px-4 py-2 font-semibold transition-colors w-full border rounded-lg block text-center ${
                    isScrolled
                      ? "text-white border-white"
                      : "text-gray-900 border-gray-900"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
              </li>
            )
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;