import { Link } from "react-router-dom";

export default function Cart({ cart, removeFromCart }) {
  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.qty, 0);

  return (
    <div>
      <h1>Cart</h1>
      {cart.length === 0 && <p>Cart is empty.</p>}
      <ul>
        {cart.map((item) => (
          <li key={item.product.id}>
            {item.product.name} x {item.qty} — €{(Number(item.product.price) * item.qty).toFixed(2)}
            <button onClick={() => removeFromCart(item.product.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: €{total.toFixed(2)}</p>
      {cart.length > 0 && <Link to="/checkout">Proceed to checkout</Link>}
    </div>
  );
}
