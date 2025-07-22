import { OrderRepository } from '../../shared/database/repositories/OrderRepository';
import { Order } from '../../shared/types/entities/Order';
import { OrderStatus } from '../../shared/types/enums/OrderStatus';
import { v4 as uuidv4 } from 'uuid';

// Mock order data
const mockOrders: Order[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
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
        id: 'pkg123',
        description: 'Test Package',
        weight: 10,
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        fragile: false
      }
    ],
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    customerId: 'customer456',
    customerName: 'Jane Smith',
    customerPhone: '+1987654321',
    deliveryAddress: {
      street: '456 Oak Ave',
      city: 'Othertown',
      state: 'NY',
      zipCode: '67890',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    packageDetails: [
      {
        id: 'pkg456',
        description: 'Another Package',
        weight: 5,
        dimensions: {
          length: 15,
          width: 10,
          height: 5
        },
        fragile: true
      }
    ],
    status: OrderStatus.CONSOLIDATED,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Mock OrderRepository for testing
export class MockOrderRepository implements Partial<OrderRepository> {
  private orders: Order[] = [...mockOrders];

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === id);
    return order ? { ...order } : null;
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<Order[]> {
    return this.orders.slice(offset, offset + limit).map(o => ({ ...o }));
  }

  async create(entity: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrder: Order = {
      ...entity,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.push(newOrder);
    return { ...newOrder };
  }

  async update(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const updatedOrder: Order = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date()
    };
    this.orders[index] = updatedOrder;
    return { ...updatedOrder };
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.orders.length;
    this.orders = this.orders.filter(o => o.id !== id);
    return this.orders.length < initialLength;
  }

  async findByStatus(
    status: OrderStatus,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    items: Order[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }
  }> {
    const filteredOrders = this.orders.filter(o => o.status === status);
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;
    const items = filteredOrders.slice(offset, offset + pageSize).map(o => ({ ...o }));
    
    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.orders.filter(o => o.customerId === customerId).map(o => ({ ...o }));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return this.update(id, { status });
  }
}