import { useEffect, useState } from "react";
import client from "../api/client";

export default function ProductList({ cart, addToCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    client.get("/products").then((res) => setProducts(res.data));
  }, []);

  return (
    <div>
      <h1>Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            {p.name} — €{Number(p.price).toFixed(2)} — {p.vendor.storeName} ({p.stockQty} left)
            <button onClick={() => addToCart(p)}>Add to cart</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
