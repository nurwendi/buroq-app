import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { Customer } from '../api/models';

export const customerService = {
  /**
   * Fetch all customers.
   * @param lite If true, fetches a lightweight version of the customer objects.
   * @returns Dictionary/Map of customers by username or an Array depending on API.
   */
  getCustomers: async (lite: boolean = true) => {
    const response = await apiClient.get(`${ENDPOINTS.CUSTOMERS}?lite=${lite}`);
    // Extracting Object.values since the server returns an object map { [username]: Customer }
    const rawData = response.data || {};
    
    if (typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData) && rawData.error) {
      console.warn('Malformed API response from customers:', rawData.error);
      return [];
    }
    
    if (typeof rawData === 'string') {
      return [];
    }

    return Object.values(rawData) as Customer[];
  },

  /**
   * Fetch a single customer's details.
   */
  getCustomerDetails: async (username: string) => {
    const response = await apiClient.get(ENDPOINTS.CUSTOMER_DETAIL(username));
    return response.data as Customer;
  },

  /**
   * Create or update a customer.
   */
  upsertCustomer: async (data: Partial<Customer>) => {
    const response = await apiClient.post(ENDPOINTS.CUSTOMERS, data);
    return response.data;
  }
};
