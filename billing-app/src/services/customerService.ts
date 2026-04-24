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
    try {
      const response = await apiClient.get(`${ENDPOINTS.CUSTOMERS}?lite=${lite}`);
      // The server returns an object map { [username]: Customer }
      const rawData = response.data || {};
      
      // Handle error response inside data
      if (typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData) && rawData.error) {
        console.warn('Malformed API response from customers:', rawData.error);
        return [];
      }
      
      // Handle non-object / non-array response
      if (typeof rawData === 'string') {
        return [];
      }

      // If API returns a wrapper { success: true, data: [...] }
      if (rawData.data && Array.isArray(rawData.data)) {
        return rawData.data as Customer[];
      }

      // If API returns array directly
      if (Array.isArray(rawData)) {
        return rawData as Customer[];
      }

      // If API returns an object map { [username]: Customer }
      if (typeof rawData === 'object' && rawData !== null) {
         return Object.values(rawData) as Customer[];
      }

      return [];
    } catch (error) {
      console.error('getCustomers API error:', error);
      return [];
    }
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
