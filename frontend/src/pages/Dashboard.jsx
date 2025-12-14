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
  const [addedItem, setAddedItem] = useState(null);
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

  const addToCart = async (id, name) => {
    try {
      await API.post("/cart/add", { sweet_id: id, quantity: 1 });
      setAddedItem(id);
      setTimeout(() => setAddedItem(null), 2000);

      // Update the sweets list to reflect decreased stock
      setSweets((prevSweets) =>
        prevSweets.map((sweet) =>
          sweet.id === id ? { ...sweet, quantity: sweet.quantity - 1 } : sweet
        )
      );

      // Trigger navbar cart count update
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">Sweet Shop</h1>
        <p className="text-gray-600 text-lg">
          Discover our premium collection of delicious sweets
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-12">
        <input
          placeholder="Search sweets by name or category..."
          className="w-full border border-gray-300 p-4 rounded-xl focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 transition shadow-sm text-gray-700"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sweets.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border border-gray-100 overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 h-28 flex items-center justify-center text-5xl group-hover:scale-110 transition duration-300">
                🍬
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  {s.name}
                </h3>
                <p className="text-gray-500 text-sm font-medium mb-4">
                  {s.category}
                </p>
                <div className="flex justify-between items-center mb-5">
                  <p className="text-3xl font-bold text-emerald-700">
                    ${s.price.toFixed(2)}
                  </p>
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      s.quantity > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {s.quantity > 0 ? `${s.quantity} in stock` : "Out of stock"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(s.id, s.name)}
                    disabled={s.quantity < 1}
                    className={`flex-1 p-3 rounded-lg font-semibold transition duration-200 relative overflow-hidden ${
                      s.quantity < 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    }`}
                  >
                    {addedItem === s.id ? (
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <span>✓</span>
                        Added!
                      </span>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                  <button
                    onClick={() => purchaseSweet(s.id, s.name)}
                    disabled={s.quantity < 1}
                    className={`flex-1 p-3 rounded-lg font-semibold transition duration-200 relative overflow-hidden ${
                      s.quantity < 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95"
                    }`}
                  >
                    {purchasedItem === s.id ? (
                      <span className="flex items-center justify-center gap-1 text-sm">
                        <span>✓</span>
                        Bought!
                      </span>
                    ) : (
                      "Purchase"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Toast Notification - Bottom Right */}
      {purchaseMessage && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-md z-50">
          <span className="text-2xl">✓</span>
          <p className="font-semibold">{purchaseMessage}</p>
        </div>
      )}
    </div>
  );
}
