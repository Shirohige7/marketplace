import { useEffect, useState } from "react";
import client from "../api/client";

export default function VendorDashboard() {
  const [vendorOrders, setVendorOrders] = useState([]);

  useEffect(() => {
    client.get("/orders/vendor/mine").then((res) => setVendorOrders(res.data));
  }, []);

  return (
    <div>
      <h1>Your orders</h1>
      <ul>
        {vendorOrders.map((vo) => (
          <li key={vo.id}>
            Order {vo.orderId} — subtotal €{Number(vo.subtotal).toFixed(2)} — status: {vo.status}
            <ul>
              {vo.items.map((item) => (
                <li key={item.id}>
                  {item.product.name} x {item.qty}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
