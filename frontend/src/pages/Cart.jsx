import { useEffect, useState } from "react";
import API from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await API.get("/cart");
      setCartItems(data.items);
      setTotal(data.total_price);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    setUpdating(cartItemId);
    try {
      await API.put(`/cart/${cartItemId}/quantity?new_quantity=${newQuantity}`);
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert(err.response?.data?.detail || "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      await API.delete(`/cart/${cartItemId}`);
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      alert("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return;
    try {
      await API.delete("/cart");
      fetchCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      alert("Failed to clear cart");
    }
  };

  const handlePurchase = async () => {
    if (cartItems.length === 0) return;

    setIsPurchasing(true);
    try {
      const { data } = await API.post("/cart/checkout");

      // Create message with all purchased items
      const itemNames = data.items
        .map((item) => `${item.name} (x${item.quantity})`)
        .join(", ");
      setPurchaseMessage(`Congratulation! You bought: ${itemNames}`);

      // Wait 4 seconds before clearing cart and redirecting
      // This ensures the message is visible first
      setTimeout(() => {
        setCartItems([]);
        setTotal(0);

        setTimeout(() => {
          setPurchaseMessage("");
          window.dispatchEvent(new Event("cartUpdated"));
          navigate("/");
        }, 500);
      }, 4000);
    } catch (err) {
      console.error("Error during checkout:", err);
      setPurchaseMessage(
        err.response?.data?.detail || "Purchase failed. Please try again."
      );
      setTimeout(() => setPurchaseMessage(""), 3000);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin text-4xl mb-4">🍬</div>
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-6">Add some sweets to get started!</p>
        <Link
          to="/"
          className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">Shopping Cart</h1>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 bg-gradient-to-r from-emerald-700 to-teal-700 border-b border-gray-200 p-5 font-semibold text-white">
          <div>Product</div>
          <div>Price</div>
          <div>Quantity</div>
          <div>Total</div>
          <div>Action</div>
        </div>

        {/* Cart Items */}
        <div>
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-5 gap-4 border-b border-gray-200 p-4 items-center hover:bg-amber-50 transition"
            >
              <div className="font-medium text-gray-800">{item.sweet_name}</div>
              <div className="text-gray-800">
                ${item.sweet_price.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={updating === item.id || item.quantity <= 1}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-8 h-8 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={updating === item.id}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-8 h-8 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  +
                </button>
              </div>
              <div className="text-gray-800 font-semibold">
                ${(item.sweet_price * item.quantity).toFixed(2)}
              </div>
              <div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-700 font-semibold transition"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-10 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-300">
          <span className="text-lg font-bold text-gray-800">Total:</span>
          <span className="text-4xl font-bold text-emerald-700">
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || cartItems.length === 0}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-bold transition duration-200 disabled:cursor-not-allowed text-lg"
          >
            {isPurchasing ? "Processing Purchase..." : "Purchase"}
          </button>
          <div className="flex gap-4">
            <button
              onClick={clearCart}
              className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition duration-200"
            >
              Clear Cart
            </button>
            <Link
              to="/"
              className="flex-1 bg-gray-700 text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition duration-200 text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Purchase Toast Notification - Bottom Right */}
      {purchaseMessage && (
        <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-md z-50">
          <span className="text-2xl">✓</span>
          <p className="font-semibold text-sm">{purchaseMessage}</p>
        </div>
      )}
    </div>
  );
}
