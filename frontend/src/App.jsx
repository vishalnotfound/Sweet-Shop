import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Cart from "./pages/Cart";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useState, useEffect } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    if (token && role) setUser({ role, username });
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍬</div>
          <p className="text-gray-700 text-xl font-semibold">
            Loading Sweet Shop...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar user={user} setUser={setUser} />
        <main className="py-12 bg-gray-50 flex-grow">
          <Routes>
            <Route
              path="/"
              element={user ? <Dashboard /> : <Navigate to="/login" />}
            />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/cart"
              element={user ? <Cart /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={
                user?.role === "admin" ? <AdminPanel /> : <Navigate to="/" />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
