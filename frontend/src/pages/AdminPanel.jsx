import { useEffect, useState } from "react";
import API from "../api";

export default function AdminPanel() {
  const [sweets, setSweets] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: 0,
    quantity: 0,
  });
  const [editingId, setEditingId] = useState(null);

  const fetchSweets = async () => {
    try {
      const { data } = await API.get("/sweets");
      setSweets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSweets();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await API.delete(`/sweets/${id}`);
      fetchSweets();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleEdit = (sweet) => {
    setEditingId(sweet.id);
    setForm({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing sweet
        await API.put(`/sweets/${editingId}`, form);
        setEditingId(null);
      } else {
        // Add new sweet
        await API.post("/sweets", form);
      }
      fetchSweets();
      setForm({ name: "", category: "", price: 0, quantity: 0 }); // Reset form
    } catch (err) {
      alert("Failed to " + (editingId ? "update" : "add") + " sweet");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: "", category: "", price: 0, quantity: 0 });
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Admin Panel</h1>
        <p className="text-gray-600 text-lg">
          Manage your sweet shop inventory
        </p>
      </div>

      {/* Add Sweet Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-10 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {editingId ? "Update Sweet" : "Add New Sweet"}
        </h2>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sweet Name
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              placeholder="e.g., Chocolate Fudge"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              placeholder="e.g., Chocolate, Candy"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price ($)
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              type="number"
              placeholder="9.99"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: parseFloat(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantity
            </label>
            <input
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition"
              type="number"
              placeholder="50"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: parseInt(e.target.value) })
              }
              required
            />
          </div>
          <button className="sm:col-span-2 bg-emerald-700 hover:bg-emerald-800 text-white p-3 rounded-lg font-bold transition duration-200">
            {editingId ? "Update Sweet" : "Add Sweet"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="sm:col-span-2 bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-bold transition duration-200"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      {/* List of Sweets */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-8 py-7 border-b border-gray-200 bg-gradient-to-r from-emerald-700 to-teal-700">
          <h2 className="text-2xl font-bold text-white">Sweet Inventory</h2>
        </div>
        {sweets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">
              No sweets in inventory yet. Add one above!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-700 to-teal-700 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sweets.map((sweet) => (
                  <tr
                    key={sweet.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {sweet.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {sweet.category}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${sweet.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          sweet.quantity > 10
                            ? "bg-emerald-100 text-emerald-700"
                            : sweet.quantity > 0
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sweet.quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(sweet)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sweet.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
