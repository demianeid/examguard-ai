import { useState, useEffect } from "react";
import { HashLink } from "react-router-hash-link";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";

const Header = ({ 
  hideSignup = false, 
  hideLogin = false, 
  fixed = false, 
  showAccount = false, 
  isRegistered = false,
  isAccountPage = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (fixed) return;
    
    const handleScroll = () => {
      const current = window.scrollY;

      if (current > lastScroll) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      if (current > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      setLastScroll(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll, fixed]);

  // Navigation items based on user status
  const navItems = isRegistered ? [
    { name: "Home", path: "/home" },
    { name: "Features", path: "/features" },
    { name: "How It Works", path: "/how-it-works" },
    { name: "Contact", path: "/contact" },
    { name: "Classes", path: "/classes" }
  ] : [
    { name: "Home", path: "/#home" },
    { name: "Features", path: "/#features" },
    { name: "How It Works", path: "/#howitworks" },
    { name: "Contact", path: "/#contact" }
  ];


  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      navigate("/");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[9999] transition-all duration-300 ease-in-out
        ${!fixed && showHeader ? "translate-y-0" : !fixed ? "-translate-y-full" : "translate-y-0"}
        ${
          isScrolled
            ? "bg-primary shadow-lg px-5 sm:px-20 py-4"
            : "bg-background px-5 sm:px-20 py-4"
        }
      `}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isRegistered ? "/home-registered" : "/"}
          className={`text-2xl font-bold ${
            isScrolled ? "text-white" : "text-gray-900"
          }`}
        >
          ExamGuard
        </Link>

        {/* Right Section - Buttons & Toggle */}
        <div className="flex items-center gap-2 lg:order-2">
          {isAccountPage ? (
            // في حالة صفحة الـ Account نعرض Logout أولاً ثم Settings
            <div className="flex items-center gap-4">
              {/* Logout Button - باللون الأحمر (danger) مع الكتابة */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 font-semibold rounded-lg border-2 transition-all ${
                  isScrolled
                    ? "bg-transparent text-red-400 border-red-400 hover:bg-red-400 hover:text-white hover:border-red-400"
                    : "bg-transparent text-danger border-danger hover:bg-danger hover:text-white hover:border-danger"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>

              {/* Settings Button - بدون بوردر وباللون الداكن */}
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
            </div>
          ) : showAccount ? (
            // في باقي الصفحات لما يكون showAccount true
            <Link
              to="/account-student"
              className={`px-5 py-3 font-semibold rounded-lg border-2 transition-all ${
                isScrolled
                  ? "bg-transparent text-white border-white/50 hover:bg-white hover:text-primary hover:border-white"
                  : "bg-transparent text-primary border-primary/50 hover:bg-primary hover:text-white hover:border-primary"
              }`}
            >
              Account
            </Link>
          ) : (
            // في الحالة العادية نعرض Login و Signup
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
                      ? "bg-white text-blue-600 border border-white hover:bg-blue-600 hover:text-white"
                      : "bg-primary text-white hover:bg-secondary"
                  }`}
                >
                  Sign up
                </Link>
              )}
            </>
          )}

          {/* Mobile Toggle */}
          <button
            className={`lg:hidden ml-2 text-2xl ${
              isScrolled ? "text-white" : "text-gray-900"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex lg:order-1 mx-auto">
          <ul className="flex items-center gap-1">
            {navItems.map((item, index) => (
              <li key={index}>
                {isRegistered ? (
                  <Link
                    to={item.path}
                    className={`relative px-3.5 py-2 font-semibold transition-colors group ${
                      isScrolled ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                    <span
                      className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                        isScrolled ? "bg-white" : "bg-blue-600"
                      }`}
                    ></span>
                  </Link>
                ) : (
                  <HashLink
                    smooth
                    to={item.path}
                    className={`relative px-3.5 py-2 font-semibold transition-colors group ${
                      isScrolled ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.name}
                    <span
                      className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                        isScrolled ? "bg-white" : "bg-blue-600"
                      }`}
                    ></span>
                  </HashLink>
                )}
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
              {isRegistered ? (
                <Link
                  to={item.path}
                  className={`block text-center px-3.5 py-2 font-semibold transition-colors ${
                    isScrolled
                      ? "text-white hover:text-blue-200"
                      : "text-gray-900 hover:text-blue-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ) : (
                <HashLink
                  smooth
                  to={item.path}
                  className={`block text-center px-3.5 py-2 font-semibold transition-colors ${
                    isScrolled
                      ? "text-white hover:text-blue-200"
                      : "text-gray-900 hover:text-blue-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </HashLink>
              )}
            </li>
          ))}

          {isAccountPage ? (
            // في الـ mobile menu لصفحة الـ Account بالترتيب الجديد
            <>
              <li className="w-full">
                <button
                  onClick={handleLogout}
                  className={`flex items-center justify-center gap-2 px-4 py-2 font-semibold transition-colors w-full border-2 rounded-lg ${
                    isScrolled
                      ? "text-red-400 border-red-400 hover:bg-red-400 hover:text-white hover:border-red-400"
                      : "text-danger border-danger hover:bg-red-500 hover:text-white hover:border-red-500"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
              <li className="w-full">
                <Link
                  to="/settings"
                  className={`flex items-center justify-center gap-2 px-4 py-2 font-semibold transition-colors w-full rounded-lg ${
                    isScrolled
                      ? "text-white hover:text-gray-300"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </li>
            </>
          ) : showAccount ? (
            <li className="w-full">
              <Link
                to="/account-student"
                className={`px-4 py-2 font-semibold transition-colors w-full border-2 rounded-lg block text-center ${
                  isScrolled
                    ? "text-white border-white/50 hover:bg-white hover:text-primary hover:border-white"
                    : "text-primary border-primary/50 hover:bg-primary hover:text-white hover:border-primary"
                }`}
              >
                Account
              </Link>
            </li>
          ) : (
            <li className="w-full">
              <Link
                to="/Login"
                className={`px-4 py-2 font-semibold transition-colors w-full border rounded-lg block text-center ${
                  isScrolled
                    ? "text-white border-white"
                    : "text-gray-900 border-gray-900"
                }`}
              >
                Log in
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Header;