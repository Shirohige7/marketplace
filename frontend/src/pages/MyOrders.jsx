import { useEffect, useState } from "react";
import client from "../api/client";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    client.get("/orders/mine").then((res) => setOrders(res.data));
  }, []);

  return (
    <div>
      <h1>My orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            Order {order.id} — €{Number(order.totalAmount).toFixed(2)} — {order.status}
            <ul>
              {order.vendorOrders.map((vo) => (
                <li key={vo.id}>Vendor sub-order — {vo.status}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
