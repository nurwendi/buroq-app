import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Payment } from '../api/models';

export const billingService = {
  /**
   * Fetch payment history, optionally filtered by username.
   */
  getPayments: async (username?: string) => {
    const url = username 
      ? `${ENDPOINTS.PAYMENTS}?username=${encodeURIComponent(username)}` 
      : ENDPOINTS.PAYMENTS;
    const response = await apiClient.get(url);
    return response.data as Payment[];
  },

  /**
   * Record a manual payment or generate an invoice.
   */
  recordPayment: async (data: any) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENTS, data);
    return response.data;
  },

  /**
   * Initiate a Midtrans payment.
   */
  initiateGatewayPayment: async (invoiceNumber: string, amount: number) => {
    const response = await apiClient.post(ENDPOINTS.PAYMENT_PAY, {
      invoiceNumber,
      amount
    });
    return response.data; // { token, redirect_url, paymentId }
  }
};
