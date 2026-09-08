import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "BUYER", storeName: "" });
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input placeholder="Email" value={form.email} onChange={update("email")} />
      <input type="password" placeholder="Password" value={form.password} onChange={update("password")} />
      <select value={form.role} onChange={update("role")}>
        <option value="BUYER">Buyer</option>
        <option value="VENDOR">Vendor</option>
      </select>
      {form.role === "VENDOR" && (
        <input placeholder="Store name" value={form.storeName} onChange={update("storeName")} />
      )}
      <button type="submit">Create account</button>
    </form>
  );
}
