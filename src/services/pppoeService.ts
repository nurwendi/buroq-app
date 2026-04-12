import apiClient from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { ActiveConnection } from '../api/models';

export const pppoeService = {
  /**
   * Fetch all active PPPoE connections.
   */
  getActiveConnections: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PPPOE_ACTIVE);
      return (Array.isArray(response.data) ? response.data : []) as ActiveConnection[];
    } catch (error) {
      console.warn('Failed to fetch active PPPoE connections', error);
      return [];
    }
  },

  /**
   * Disconnect a specific active connection (Kick).
   */
  disconnectSession: async (id: string) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.PPPOE_ACTIVE}/${id}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to disconnect session', error);
      throw error;
    }
  }
};
