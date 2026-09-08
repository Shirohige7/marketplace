jest.mock("../repositories/productRepository");
jest.mock("../repositories/orderRepository");
jest.mock("../services/stripeService");
jest.mock("../config/db", () => ({ payment: { create: jest.fn() } }));

const productRepository = require("../repositories/productRepository");
const orderRepository = require("../repositories/orderRepository");
const stripeService = require("../services/stripeService");
const prisma = require("../config/db");
const checkoutService = require("../services/checkoutService");

function mockProduct(overrides) {
  return { id: "p1", vendorId: "v1", name: "Widget", price: "10.00", stockQty: 5, ...overrides };
}

describe("checkoutService.checkout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects an empty cart", async () => {
    await expect(checkoutService.checkout("buyer1", [])).rejects.toThrow("Cart is empty");
  });

  it("rejects checkout when requested qty exceeds stock", async () => {
    productRepository.findById.mockResolvedValue(mockProduct({ stockQty: 1 }));

    await expect(
      checkoutService.checkout("buyer1", [{ productId: "p1", qty: 2 }])
    ).rejects.toThrow(/Not enough stock/);
  });

  it("splits a multi-vendor cart into one VendorOrder group per vendor", async () => {
    productRepository.findById.mockImplementation((id) =>
      Promise.resolve(
        id === "p1" ? mockProduct({ id: "p1", vendorId: "vA", price: "10.00" }) : mockProduct({ id: "p2", vendorId: "vB", price: "5.00" })
      )
    );
    orderRepository.createOrderWithVendorSplit.mockResolvedValue({ id: "order1", vendorOrders: [] });
    stripeService.createPaymentIntent.mockResolvedValue({ id: "pi_1", client_secret: "secret_1", status: "requires_payment_method" });
    prisma.payment.create.mockResolvedValue({});

    const result = await checkoutService.checkout("buyer1", [
      { productId: "p1", qty: 2 }, // 20.00, vendor A
      { productId: "p2", qty: 1 }, // 5.00, vendor B
    ]);

    const [, args] = orderRepository.createOrderWithVendorSplit.mock.calls[0];
    expect(orderRepository.createOrderWithVendorSplit).toHaveBeenCalledTimes(1);
    const callArg = orderRepository.createOrderWithVendorSplit.mock.calls[0][0];
    expect(callArg.itemsByVendor.size).toBe(2); // one group per vendor
    expect(callArg.totalAmount).toBe(25);

    // Stripe is charged the COMBINED total in cents, as a single PaymentIntent.
    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(2500, { orderId: "order1" });
    expect(result).toEqual({ orderId: "order1", clientSecret: "secret_1" });
  });
});
