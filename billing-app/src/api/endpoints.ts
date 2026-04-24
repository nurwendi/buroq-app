export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',

  // Customers
  CUSTOMERS: '/api/customers',
  CUSTOMER_DETAIL: (username: string) => `/api/customers/${username}`,

  // PPPoE
  PPPOE_ACTIVE: '/api/pppoe/active',

  // Billing & Payments
  PAYMENTS: '/api/billing/payments',
  PAYMENT_PAY: '/api/billing/pay',
};
