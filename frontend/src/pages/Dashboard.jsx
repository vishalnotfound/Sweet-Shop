import { useEffect, useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [sweets, setSweets] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [purchasedItem, setPurchasedItem] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const navigate = useNavigate();

  const fetchSweets = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await API.get(`/sweets?search=${search}`);
      setSweets(data);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || err.message || "Failed to load sweets";
      setError(errorMsg);
      console.error("Error fetching sweets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSweets();
  }, [search]);

  const purchaseSweet = async (id, name) => {
    try {
      await API.post(`/sweets/${id}/purchase`);
      setPurchasedItem(id);
      setPurchaseMessage(`Congratulation! You bought ${name}`);
      
      // Update the sweets list to reflect decreased stock
      setSweets((prevSweets) =>
        prevSweets.map((sweet) =>
          sweet.id === id ? { ...sweet, quantity: sweet.quantity - 1 } : sweet
        )
      );

      // Hide message after 3 seconds
      setTimeout(() => {
        setPurchasedItem(null);
        setPurchaseMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error purchasing sweet:", err);
      setPurchaseMessage("Failed to purchase. Please try again.");
      setTimeout(() => setPurchaseMessage(""), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Sweet Shop</h1>
        <p className="text-gray-600">
          Discover our delicious collection of sweets
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          placeholder="Search sweets by name or category..."
          className="w-full border border-gray-300 p-4 rounded-lg focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition shadow-sm"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Purchase Success Message */}
      {purchaseMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-lg mb-6 flex items-center animate-pulse">
          <span className="text-2xl mr-3">✓</span>
          <p>{purchaseMessage}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🍬</div>
            <p className="text-gray-600 text-lg">Loading sweets...</p>
          </div>
        </div>
      ) : sweets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍬</div>
          <p className="text-gray-600 text-lg">
            No sweets found matching your search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sweets.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition border border-gray-200 overflow-hidden"
            >
              <div className="bg-gray-100 h-24 flex items-center justify-center text-4xl">
                🍬
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {s.name}
                </h3>
                <p className="text-gray-600 text-sm font-medium mb-3">
                  {s.category}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-2xl font-bold text-gray-800">
                    ${s.price.toFixed(2)}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      s.quantity > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.quantity > 0 ? `${s.quantity} in stock` : "Out of stock"}
                  </span>
                </div>
                <button
                  onClick={() => purchaseSweet(s.id, s.name)}
                  disabled={s.quantity < 1}
                  className={`w-full p-3 rounded-lg font-semibold transition relative overflow-hidden ${
                    s.quantity < 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-green-700 text-white hover:bg-green-800 active:scale-95"
                  }`}
                >
                  {purchasedItem === s.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="text-lg">✓</span>
                      Purchased!
                    </span>
                  ) : (
                    "Purchase"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
