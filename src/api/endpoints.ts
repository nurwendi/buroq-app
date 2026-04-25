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
  PPPOE_USERS: '/api/pppoe/users',
  PPPOE_PROFILES: '/api/pppoe/profiles',

  // Registrations / Approvals
  REGISTRATIONS: '/api/registrations',

  // Admin
  ADMIN_USERS: '/api/admin/users',

  // Billing & Payments
  PAYMENTS: '/api/billing/payments',
  PAYMENT_PAY: '/api/billing/pay',

  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  ADMIN_STATS: '/api/admin/stats',
  ADMIN_STATS_OWNERS: '/api/admin/stats/owners',
  BILLING_STATS: '/api/billing/stats',
  SYSTEM_INFO: '/api/system/info',
  APP_SETTINGS: '/api/app-settings',
};
