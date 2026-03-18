import { useState, useEffect, useRef } from "react";
import { HashLink } from "react-router-hash-link";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { LogOut, Settings, User, WifiOff } from "lucide-react";
import { useUser } from '../context/UserContext';
import NotificationDropdown from "../pages/NotificationDropdown";

const LOGO_URL = "/images/logo1.png";
const SCROLLED_LOGO_URL = "/images/logo2.png";

interface HeaderProps {
  hideSignup?: boolean;
  hideLogin?: boolean;
  fixed?: boolean;
  showAccount?: boolean;
  isRegistered?: boolean;
  isAccountPage?: boolean;
  userType?: 'student' | 'instructor';
}

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
  
  // hide/show on scroll
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  let contextUserType: 'student' | 'instructor' = 'student';
  let setUserType: (type: 'student' | 'instructor') => void = () => {};

  try {
    const userContext = useUser();
    contextUserType = userContext.userType;
    setUserType = userContext.setUserType;
  } catch (error) {
    console.warn('UserContext not available, using default values');
  }

  const userType = propUserType || contextUserType;

  const isAccountPageAuto = location.pathname === "/account-instructor" || 
                            location.pathname === "/account-student";

  useEffect(() => {
    if (location.pathname === "/home-instructor" || 
        location.pathname === "/account-instructor" ||
        location.pathname === "/classes-instructor" ||
        location.pathname === "/offline-mode" ||
        location.pathname.startsWith("/classes-instructor/")) {
      setUserType('instructor');
    } else if (location.pathname === "/home" || 
               location.pathname === "/account-student" ||
               location.pathname === "/classes" ||
               location.pathname.startsWith("/classes/")) {
      setUserType('student');
    }
  }, [location.pathname, setUserType]);

  // scroll direction logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // تحديد إذا scrolled فوق الـ 50px
      setIsScrolled(currentScrollY > 50);

      // إخفاء لما بنزل، إظهار لما بنطلع
      if (currentScrollY <= 0) {
        // في الأعلى دايماً يظهر
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        // نازل → إخفاء (الـ +5 عشان نتجنب الـ micro-movements)
        setIsVisible(false);
        if (isMenuOpen) setIsMenuOpen(false); // اقفل المنيو لو فاتح
      } else if (currentScrollY < lastScrollY.current - 5) {
        // طالع → إظهار
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  const currentLogo = isScrolled ? SCROLLED_LOGO_URL : LOGO_URL;

  const getNavPaths = () => {
    if (!isRegistered) {
      return {
        home: "/#home",
        features: "/#features",
        howItWorks: "/#howitworks",
        contact: "/#contact",
        offlineMode: "/#offline-mode"
      };
    }

    const baseHomePath = userType === 'instructor' ? "/home-instructor" : "/home";
    const classesPath = userType === 'instructor' ? "/classes-instructor" : "/classes";
    
    return {
      home: baseHomePath,
      features: "/features",
      howItWorks: "/how-it-works",
      contact: "/contact",
      classes: classesPath,
      offlineMode: userType === 'instructor' ? "/OfflineMode" : undefined
    };
  };

  const paths = getNavPaths();

  const ensurePath = (path: string | undefined): string => path || "/";

  const getNavItems = () => {
    if (isRegistered) {
      const items = [
        { name: "Home", path: ensurePath(paths.home) },
        { name: "Features", path: ensurePath(paths.features) },
        { name: "How It Works", path: ensurePath(paths.howItWorks) },
        { name: "Contact", path: ensurePath(paths.contact) },
        { name: "Classes", path: ensurePath(paths.classes) }
      ];
      
      if (userType === 'instructor' && paths.offlineMode) {
        items.push({ name: "Offline Mode", path: paths.offlineMode });
      }
      
      return items;
    } else {
      return [
        { name: "Home", path: ensurePath(paths.home) },
        { name: "Features", path: ensurePath(paths.features) },
        { name: "How It Works", path: ensurePath(paths.howItWorks) },
        { name: "Contact", path: ensurePath(paths.contact) }
      ];
    }
  };

  const navItems = getNavItems();
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      setUserType('student');
      navigate("/");
    }
  };

  const finalIsAccountPage = isAccountPage || isAccountPageAuto;

  const getHomePath = (): string => {
    if (!isRegistered) return "/";
    return userType === 'instructor' ? "/home-instructor" : "/home";
  };

  const getAccountPath = (): string => {
    return userType === 'instructor' ? "/account-instructor" : "/account-student";
  };

  const renderNavLink = (item: { name: string; path: string; icon?: React.ReactNode }, isMobile: boolean = false) => {
    const baseClasses = isMobile 
      ? `block text-center px-3.5 py-2 font-semibold transition-colors ${
          isScrolled ? "text-white hover:text-blue-200" : "text-gray-900 hover:text-blue-600"
        }`
      : `relative px-3.5 py-2 font-semibold transition-colors group ${
          isScrolled ? "text-white" : "text-gray-900"
        }`;

    const content = (
      <>
        {item.icon && item.icon}
        {item.name}
      </>
    );

    if (isRegistered) {
      return (
        <Link to={item.path} className={baseClasses} onClick={() => isMobile && setIsMenuOpen(false)}>
          {content}
          {!isMobile && (
            <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-white" : "bg-blue-600"}`}></span>
          )}
        </Link>
      );
    } else {
      if (isValidHashLinkPath(item.path)) {
        return (
          <HashLink smooth to={item.path} className={baseClasses} onClick={() => isMobile && setIsMenuOpen(false)}>
            {content}
            {!isMobile && (
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${isScrolled ? "bg-white" : "bg-blue-600"}`}></span>
            )}
          </HashLink>
        );
      } else {
        return (
          <Link to={item.path} className={baseClasses} onClick={() => isMobile && setIsMenuOpen(false)}>
            {content}
            {!isMobile && (
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-primary`}></span>
            )}
          </Link>
        );
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ease-in-out
        ${isVisible ? "translate-y-0" : "-translate-y-full"}
        ${isScrolled
          ? "bg-p1/80 backdrop-blur-md shadow-lg px-5 sm:px-20 py-3"
          : "bg-background px-5 sm:px-20 py-3"
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to={getHomePath()} className="flex items-center">
          <img 
            src={currentLogo}
            alt="ExamGuard Logo" 
            className="h-9 sm:h-9 w-auto object-contain transition-all duration-300"
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex lg:order-1 text-sm mx-auto">
          <ul className="flex items-center gap-1">
            {navItems.map((item, index) => (
              <li key={index}>{renderNavLink(item, false)}</li>
            ))}
          </ul>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:order-2">
          {isRegistered && <NotificationDropdown userType={userType} />}
          
          {finalIsAccountPage ? (
            <div className="flex items-center gap-4">
              <Link
                to="/settings"
                className={`p-2 font-semibold rounded-lg transition-all ${
                  isScrolled ? "text-white hover:text-gray-300" : "text-gray-700 hover:text-gray-900"
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

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

              <button
                className={`lg:hidden ml-2 text-2xl ${isScrolled ? "text-white" : "text-gray-900"}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          ) : showAccount ? (
            <>
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

              <Link
                to={getAccountPath()}
                className={`lg:hidden p-2 font-semibold rounded-lg transition-all ${
                  isScrolled ? "text-white hover:text-gray-300" : "text-gray-700 hover:text-gray-900"
                }`}
                title="Account"
              >
                <User className="w-5 h-5" />
              </Link>

              <button
                className={`lg:hidden ml-2 text-2xl ${isScrolled ? "text-white" : "text-gray-900"}`}
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
                    isScrolled ? "text-white hover:text-blue-200" : "text-gray-900 hover:text-blue-600"
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

              <button
                className={`lg:hidden ml-2 text-2xl ${isScrolled ? "text-white" : "text-gray-900"}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </>
          )}
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

          {isRegistered ? (
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
            ) : null
          ) : (
            !hideLogin && (
              <li className="w-full">
                <Link
                  to="/Login"
                  className={`px-4 py-2 font-semibold transition-colors w-full border rounded-lg block text-center ${
                    isScrolled ? "text-white border-white" : "text-gray-900 border-gray-900"
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