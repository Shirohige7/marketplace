import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import VendorDashboard from "./pages/VendorDashboard";
import MyOrders from "./pages/MyOrders";

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav>
      <Link to="/">Products</Link> | <Link to="/cart">Cart</Link>
      {user?.role === "BUYER" && <> | <Link to="/orders">My orders</Link></>}
      {user?.role === "VENDOR" && <> | <Link to="/vendor">Vendor dashboard</Link></>}
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <> | <Link to="/login">Login</Link></>
      )}
    </nav>
  );
}

function AppRoutes() {
  const [cart, setCart] = useState([]); // [{ product, qty }]

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<ProductList cart={cart} addToCart={addToCart} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute role="BUYER">
              <Checkout cart={cart} clearCart={() => setCart([])} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute role="BUYER">
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
