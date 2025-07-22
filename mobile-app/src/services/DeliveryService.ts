import axios from 'axios';
import { Order } from '../../../shared/types/entities/Order';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Types for delivery confirmation and failure reporting
export interface DeliveryProof {
  signature?: string | null;
  photo?: string | null;
  notes?: string;
  handedToCustomer?: boolean;
  timestamp: string;
}

export interface DeliveryFailure {
  reason: string;
  notes?: string;
  photo?: string | null;
  nextAction: 'retry_later' | 'return_to_depot';
  timestamp: string;
}

export const DeliveryService = {
  /**
   * Get details for a specific order
   */
  getOrderDetails: async (orderId: string): Promise<Order> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  /**
   * Get all active deliveries for the current driver
   */
  getActiveDeliveries: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dispatch/active/deliveries`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
      throw error;
    }
  },

  /**
   * Confirm successful delivery of an order
   */
  confirmDelivery: async (orderId: string, stopId: string, deliveryProof: DeliveryProof): Promise<void> => {
    try {
      // Upload photo if exists
      let photoUrl = null;
      if (deliveryProof.photo) {
        photoUrl = await DeliveryService.uploadDeliveryPhoto(orderId, deliveryProof.photo);
      }

      // Upload signature if exists
      let signatureUrl = null;
      if (deliveryProof.signature) {
        signatureUrl = await DeliveryService.uploadSignature(orderId, deliveryProof.signature);
      }

      // Send confirmation with URLs instead of raw data
      await axios.post(`${API_BASE_URL}/dispatch/${stopId}/delivery`, {
        orderId,
        status: 'delivered',
        proof: {
          ...deliveryProof,
          photo: photoUrl,
          signature: signatureUrl
        }
      });
    } catch (error) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  },

  /**
   * Report a failed delivery attempt
   */
  reportDeliveryFailure: async (orderId: string, stopId: string, failureDetails: DeliveryFailure): Promise<void> => {
    try {
      // Upload photo if exists
      let photoUrl = null;
      if (failureDetails.photo) {
        photoUrl = await DeliveryService.uploadDeliveryPhoto(orderId, failureDetails.photo);
      }

      // Send failure report with URL instead of raw photo data
      await axios.post(`${API_BASE_URL}/dispatch/${stopId}/delivery/failure`, {
        orderId,
        status: 'failed',
        failureDetails: {
          ...failureDetails,
          photo: photoUrl
        }
      });
    } catch (error) {
      console.error('Error reporting delivery failure:', error);
      throw error;
    }
  },

  /**
   * Upload delivery photo to server
   */
  uploadDeliveryPhoto: async (orderId: string, photoUri: string): Promise<string> => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Extract filename from URI
      const uriParts = photoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      // Append file to form data
      formData.append('photo', {
        uri: photoUri,
        name: fileName,
        type: 'image/jpeg'
      } as any);
      
      // Upload photo
      const response = await axios.post(
        `${API_BASE_URL}/uploads/delivery/${orderId}/photo`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading delivery photo:', error);
      throw error;
    }
  },

  /**
   * Upload signature to server
   */
  uploadSignature: async (orderId: string, signatureUri: string): Promise<string> => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      
      // Extract filename from URI or create one
      const fileName = `signature_${orderId}_${Date.now()}.png`;
      
      // Append file to form data
      formData.append('signature', {
        uri: signatureUri,
        name: fileName,
        type: 'image/png'
      } as any);
      
      // Upload signature
      const response = await axios.post(
        `${API_BASE_URL}/uploads/delivery/${orderId}/signature`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.url;
    } catch (error) {
      console.error('Error uploading signature:', error);
      throw error;
    }
  },

  /**
   * Update driver location
   */
  updateDriverLocation: async (latitude: number, longitude: number): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/drivers/location`, {
        location: { latitude, longitude },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating driver location:', error);
      // Don't throw here to prevent UI disruption for location updates
    }
  }
};

export default DeliveryService;