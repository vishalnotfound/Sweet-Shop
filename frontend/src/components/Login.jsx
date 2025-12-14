import { useState } from "react";
import API from "../api";
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
        await API.post("/auth/register", formData);
        alert("Registered! Please login.");
        setIsRegister(false);
      } else {
        const formDataUrl = new FormData(); // OAuth2 expects form data
        formDataUrl.append("username", formData.username);
        formDataUrl.append("password", formData.password);

        const { data } = await API.post("/auth/login", formDataUrl);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", formData.username);
        setUser({ role: data.role, username: formData.username });
        navigate("/");
      }
    } catch (err) {
      alert("Error: " + err.response?.data?.detail || "Failed");
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
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          {isRegister && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Type
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
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
