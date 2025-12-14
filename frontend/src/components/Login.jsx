import { useState } from "react";
import API from "../api"; // Make sure your api.js has baseURL including /api
import { useNavigate } from "react-router-dom";

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        // Registration
        await API.post("/auth/register", formData);
        alert("Registered successfully! Please login.");
        setIsRegister(false);
      } else {
        // Login
        const formDataUrl = new FormData();
        formDataUrl.append("username", formData.username);
        formDataUrl.append("password", formData.password);

        const { data } = await API.post("/auth/login", formDataUrl);

        // Save token & user info
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", formData.username);
        setUser({ role: data.role, username: formData.username });

        navigate("/"); // redirect to home/dashboard
      }
    } catch (err) {
      alert("Error: " + err.response?.data?.detail || "Login/Register failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-5xl mb-4">🍬</h1>
          <h2 className="text-3xl font-bold text-gray-900">
            {isRegister ? "Join Us" : "Welcome Back"}
          </h2>
          <p className="text-gray-500 mt-2">Sweet Shop</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Type
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-3 rounded-lg font-bold transition duration-200 mt-8">
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            {isRegister
              ? "Already have an account? "
              : "Don't have an account? "}
          </p>
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-green-700 font-semibold hover:text-green-800 transition"
          >
            {isRegister ? "Login here" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
