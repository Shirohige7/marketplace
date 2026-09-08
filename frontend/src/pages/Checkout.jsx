import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import client from "../api/client";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ clientSecret, clearCart }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");

    // This confirms payment with Stripe directly from the browser.
    // The actual order state (PAID + stock decrement + vendor ledger) is
    // only ever updated by the backend webhook, never by this callback —
    // this redirect is just UX, not the source of truth.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/orders` },
    });

    if (confirmError) {
      setError(confirmError.message);
      setSubmitting(false);
    } else {
      clearCart();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button type="submit" disabled={!stripe || submitting}>
        {submitting ? "Processing..." : "Pay"}
      </button>
    </form>
  );
}

export default function Checkout({ cart, clearCart }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cart.length === 0) return;
    client
      .post("/checkout", { items: cart.map((i) => ({ productId: i.product.id, qty: i.qty })) })
      .then((res) => setClientSecret(res.data.clientSecret))
      .catch((err) => setError(err.response?.data?.error || "Checkout failed"));
  }, [cart]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!clientSecret) return <p>Preparing checkout…</p>;

  return (
    <div>
      <h1>Checkout</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm clientSecret={clientSecret} clearCart={clearCart} />
      </Elements>
    </div>
  );
}
