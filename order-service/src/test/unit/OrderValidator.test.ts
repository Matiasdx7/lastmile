import { OrderValidator } from '../../validators/OrderValidator';
import { ValidationError } from '../../middleware/errorHandler';
import { OrderStatus } from '../../../../shared/types/enums/OrderStatus';

describe('OrderValidator', () => {
  // Valid order data for testing
  const validOrderData = {
    customerId: 'customer123',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    deliveryAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    },
    packageDetails: [
      {
        description: 'Test Package',
        weight: 10,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        fragile: false
      }
    ]
  };

  describe('validateCreate', () => {
    it('should not throw error for valid order data', () => {
      expect(() => OrderValidator.validateCreate(validOrderData)).not.toThrow();
    });

    it('should throw ValidationError for missing required fields', () => {
      const invalidData = {
        customerName: 'John Doe'
        // Missing other required fields
      };

      expect(() => OrderValidator.validateCreate(invalidData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid phone format', () => {
      const invalidData = {
        ...validOrderData,
        customerPhone: 'invalid-phone'
      };

      expect(() => OrderValidator.validateCreate(invalidData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid coordinates', () => {
      const invalidData = {
        ...validOrderData,
        deliveryAddress: {
          ...validOrderData.deliveryAddress,
          coordinates: {
            latitude: 100, // Invalid latitude (> 90)
            longitude: -122.4194
          }
        }
      };

      expect(() => OrderValidator.validateCreate(invalidData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty package details', () => {
      const invalidData = {
        ...validOrderData,
        packageDetails: [] // Empty array
      };

      expect(() => OrderValidator.validateCreate(invalidData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for negative package dimensions', () => {
      const invalidData = {
        ...validOrderData,
        packageDetails: [
          {
            ...validOrderData.packageDetails[0],
            dimensions: {
              length: -10, // Negative dimension
              width: 15,
              height: 10
            }
          }
        ]
      };

      expect(() => OrderValidator.validateCreate(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateUpdate', () => {
    it('should not throw error for valid update data', () => {
      const updateData = {
        customerName: 'Jane Doe',
        specialInstructions: 'Please leave at the door'
      };

      expect(() => OrderValidator.validateUpdate(updateData)).not.toThrow();
    });

    it('should not throw error for empty update data', () => {
      expect(() => OrderValidator.validateUpdate({})).not.toThrow();
    });

    it('should throw ValidationError for invalid status', () => {
      const invalidData = {
        status: 'invalid-status' // Not a valid OrderStatus
      };

      expect(() => OrderValidator.validateUpdate(invalidData)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid time window', () => {
      const invalidData = {
        timeWindow: {
          startTime: '2023-01-01T12:00:00Z',
          endTime: '2023-01-01T10:00:00Z' // End time before start time
        }
      };

      expect(() => OrderValidator.validateUpdate(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateId', () => {
    it('should not throw error for valid UUID', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => OrderValidator.validateId(validId)).not.toThrow();
    });

    it('should throw ValidationError for invalid UUID format', () => {
      const invalidId = 'not-a-uuid';
      expect(() => OrderValidator.validateId(invalidId)).toThrow(ValidationError);
    });
  });

  describe('needsManualReview', () => {
    it('should return true for orders with special instructions keywords', () => {
      const orderWithSpecialInstructions = {
        ...validOrderData,
        specialInstructions: 'This package is fragile, please handle with care'
      };

      expect(OrderValidator.needsManualReview(orderWithSpecialInstructions)).toBe(true);
    });

    it('should return true for orders with heavy packages', () => {
      const orderWithHeavyPackage = {
        ...validOrderData,
        packageDetails: [
          {
            ...validOrderData.packageDetails[0],
            weight: 60 // Over 50kg
          }
        ]
      };

      expect(OrderValidator.needsManualReview(orderWithHeavyPackage)).toBe(true);
    });

    it('should return true for orders with large packages', () => {
      const orderWithLargePackage = {
        ...validOrderData,
        packageDetails: [
          {
            ...validOrderData.packageDetails[0],
            dimensions: {
              length: 250, // Over 200cm
              width: 15,
              height: 10
            }
          }
        ]
      };

      expect(OrderValidator.needsManualReview(orderWithLargePackage)).toBe(true);
    });

    it('should return true for orders with fragile packages', () => {
      const orderWithFragilePackage = {
        ...validOrderData,
        packageDetails: [
          {
            ...validOrderData.packageDetails[0],
            fragile: true
          }
        ]
      };

      expect(OrderValidator.needsManualReview(orderWithFragilePackage)).toBe(true);
    });

    it('should return false for regular orders', () => {
      expect(OrderValidator.needsManualReview(validOrderData)).toBe(false);
    });
  });
});