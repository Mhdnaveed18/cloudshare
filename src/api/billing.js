import apiClient from "./client";
import { API_URLS } from "./urls";

/**
 * Billing API wrapper for subscription payments (Razorpay)
 */
export const billingApi = {
  /**
   * Create an order for a plan. Backend should infer user from JWT.
   * Accepts optional params like plan, amount, currency for flexibility.
   */
  async createOrder(params = {}) {
    const { data } = await apiClient.post(API_URLS.billing.createOrder, params);
    // Normalize common order response shapes
    const payload = data?.data ?? data ?? {};
    return {
      raw: data,
      orderId: payload.orderId || payload.id || payload.order_id || payload.razorpayOrderId || null,
      amount: Number(payload.amount ?? payload.amountDue ?? payload.amount_due ?? 0),
      currency: payload.currency || payload.curr || "INR",
      key: payload.key || payload.razorpayKey || payload.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || null,
      name: payload.name || payload.planName || "CloudShare Premium",
      description: payload.description || payload.desc || "Premium subscription",
      receipt: payload.receipt || null,
      notes: payload.notes || {},
    };
  },

  /**
   * Verify payment with backend.
   */
  async verifyPayment({ orderId, paymentId, signature }) {
    const payload = { orderId, paymentId, signature };
    const { data } = await apiClient.post(API_URLS.billing.verifyPayment, payload);
    return data; // envelope with success and message
  },

  /**
   * Fetch billing status (premium or not) if backend supports it.
   */
  async status() {
    const { data } = await apiClient.get(API_URLS.billing.status);
    return data;
  },
};

export default billingApi;
