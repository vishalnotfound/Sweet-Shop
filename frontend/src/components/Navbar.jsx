import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../api";

export default function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const { data } = await API.get("/cart");
      setCartCount(data.items.length);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    window.addEventListener("cartUpdated", fetchCartCount);
    return () => window.removeEventListener("cartUpdated", fetchCartCount);
  }, []);

  return (
    <nav className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-3">
        <div className="bg-emerald-50 rounded-2xl shadow-md px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 text-2xl font-bold text-emerald-800 hover:text-emerald-900 transition"
            >
              <span>🍬</span>
              <span>Sweet Shop</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6 items-center">
              {user ? (
                <>
                  <Link
                    to="/"
                    className="text-gray-700 hover:text-emerald-700 transition font-medium text-sm"
                  >
                    Shop
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="text-gray-700 hover:text-emerald-700 transition font-medium text-sm"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/cart"
                    className="relative text-gray-700 hover:text-emerald-700 transition font-medium text-sm group"
                  >
                    <span className="flex items-center gap-1">
                      🛒
                      {cartCount > 0 && (
                        <span className="inline-flex bg-emerald-700 text-white text-xs font-bold rounded-full w-5 h-5 items-center justify-center group-hover:bg-emerald-800 transition">
                          {cartCount}
                        </span>
                      )}
                    </span>
                  </Link>
                  <div className="border-l border-gray-200 pl-6 flex gap-4 items-center">
                    <span className="text-sm text-gray-600">
                      {user.username}
                      <span className="text-xs text-gray-500 ml-1">
                        ({user.role})
                      </span>
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition rounded-xl shadow-md hover:shadow-lg"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3 border-t border-emerald-200 pt-4">
              {user ? (
                <>
                  <div className="px-0 py-2 text-sm text-gray-600 font-medium">
                    {user.username}{" "}
                    <span className="text-xs text-gray-500">({user.role})</span>
                  </div>
                  <Link
                    to="/"
                    className="block text-gray-700 hover:text-emerald-700 transition font-medium py-2 text-sm"
                  >
                    Shop
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="block text-gray-700 hover:text-emerald-700 transition font-medium py-2 text-sm"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/cart"
                    className="block text-gray-700 hover:text-emerald-700 transition font-medium py-2 text-sm"
                  >
                    🛒 Cart{" "}
                    {cartCount > 0 && (
                      <span className="inline-block bg-emerald-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                        ({cartCount})
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-800 transition font-semibold rounded-xl text-sm shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
