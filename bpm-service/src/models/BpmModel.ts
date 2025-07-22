import { OrderStatus } from '../../../shared/types/enums/OrderStatus';
import { LoadStatus } from '../../../shared/types/enums/LoadStatus';
import { VehicleStatus } from '../../../shared/types/enums/VehicleStatus';
import { RouteStatus } from '../../../shared/types/enums/RouteStatus';
import { DispatchStatus } from '../../../shared/types/enums/DispatchStatus';
import { DeliveryStatus } from '../../../shared/types/enums/DeliveryStatus';

export interface ProcessNode {
  id: string;
  name: string;
  type: 'main' | 'sub' | 'start' | 'end';
  status?: string;
  count?: number;
  metrics?: ProcessMetrics;
  parent?: string;
}

export interface ProcessEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ProcessMetrics {
  averageTime: number; // in minutes
  count: number;
  errorRate: number; // percentage
  bottleneck: boolean;
}

export interface ProcessDiagram {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
}

export interface OrderProcessState {
  orderId: string;
  currentStage: string;
  history: {
    stage: string;
    enteredAt: Date;
    completedAt?: Date;
    duration?: number; // in minutes
  }[];
}

// Main process stages mapping to order status
export const processStageMap = {
  'order-reception': [OrderStatus.PENDING],
  'load-consolidation': [OrderStatus.CONSOLIDATED],
  'vehicle-assignment': [OrderStatus.ASSIGNED],
  'route-planning': [OrderStatus.ROUTED],
  'dispatch': [OrderStatus.DISPATCHED],
  'delivery': [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED, OrderStatus.FAILED]
};

// Define the main process flow diagram structure
export const mainProcessFlow: ProcessDiagram = {
  nodes: [
    { id: 'order-reception', name: 'Order Reception', type: 'main' },
    { id: 'load-consolidation', name: 'Load Consolidation', type: 'main' },
    { id: 'vehicle-assignment', name: 'Vehicle Assignment', type: 'main' },
    { id: 'route-planning', name: 'Route Planning', type: 'main' },
    { id: 'dispatch', name: 'Dispatch', type: 'main' },
    { id: 'delivery', name: 'Delivery to Customer', type: 'main' },
    
    // Sub-processes for Order Reception
    { id: 'validate-order', name: 'Validate Order', type: 'sub', parent: 'order-reception' },
    { id: 'store-order', name: 'Store Order', type: 'sub', parent: 'order-reception' },
    
    // Sub-processes for Load Consolidation
    { id: 'group-orders', name: 'Group Orders', type: 'sub', parent: 'load-consolidation' },
    { id: 'create-load', name: 'Create Load', type: 'sub', parent: 'load-consolidation' },
    
    // Sub-processes for Vehicle Assignment
    { id: 'check-vehicles', name: 'Check Vehicle Availability', type: 'sub', parent: 'vehicle-assignment' },
    { id: 'assign-vehicle', name: 'Assign Vehicle', type: 'sub', parent: 'vehicle-assignment' },
    
    // Sub-processes for Route Planning
    { id: 'generate-route', name: 'Generate Route', type: 'sub', parent: 'route-planning' },
    { id: 'optimize-sequence', name: 'Optimize Sequence', type: 'sub', parent: 'route-planning' },
    
    // Sub-processes for Dispatch
    { id: 'send-to-driver', name: 'Send to Driver', type: 'sub', parent: 'dispatch' },
    { id: 'start-tracking', name: 'Start Tracking', type: 'sub', parent: 'dispatch' },
    
    // Sub-processes for Delivery
    { id: 'confirm-delivery', name: 'Confirm Delivery', type: 'sub', parent: 'delivery' },
    { id: 'update-status', name: 'Update Status', type: 'sub', parent: 'delivery' }
  ],
  edges: [
    // Main process flow
    { source: 'order-reception', target: 'load-consolidation' },
    { source: 'load-consolidation', target: 'vehicle-assignment' },
    { source: 'vehicle-assignment', target: 'route-planning' },
    { source: 'route-planning', target: 'dispatch' },
    { source: 'dispatch', target: 'delivery' },
    
    // Order Reception sub-processes
    { source: 'order-reception', target: 'validate-order' },
    { source: 'validate-order', target: 'store-order' },
    
    // Load Consolidation sub-processes
    { source: 'load-consolidation', target: 'group-orders' },
    { source: 'group-orders', target: 'create-load' },
    
    // Vehicle Assignment sub-processes
    { source: 'vehicle-assignment', target: 'check-vehicles' },
    { source: 'check-vehicles', target: 'assign-vehicle' },
    
    // Route Planning sub-processes
    { source: 'route-planning', target: 'generate-route' },
    { source: 'generate-route', target: 'optimize-sequence' },
    
    // Dispatch sub-processes
    { source: 'dispatch', target: 'send-to-driver' },
    { source: 'send-to-driver', target: 'start-tracking' },
    
    // Delivery sub-processes
    { source: 'delivery', target: 'confirm-delivery' },
    { source: 'confirm-delivery', target: 'update-status' }
  ]
};

// Detailed state diagram for order status transitions
export const orderStateFlow: ProcessDiagram = {
  nodes: [
    { id: 'start', name: 'Start', type: 'start' },
    { id: 'order-received', name: 'Order Received', type: 'main' },
    { id: 'validated', name: 'Validated', type: 'main' },
    { id: 'rejected', name: 'Rejected', type: 'main' },
    { id: 'pending', name: 'Pending', type: 'main' },
    { id: 'consolidated', name: 'Consolidated', type: 'main' },
    { id: 'vehicle-assigned', name: 'Vehicle Assigned', type: 'main' },
    { id: 'route-optimized', name: 'Route Optimized', type: 'main' },
    { id: 'dispatched', name: 'Dispatched', type: 'main' },
    { id: 'in-transit', name: 'In Transit', type: 'main' },
    { id: 'at-location', name: 'At Location', type: 'main' },
    { id: 'delivered', name: 'Delivered', type: 'main' },
    { id: 'failed', name: 'Failed', type: 'main' },
    { id: 'rescheduled', name: 'Rescheduled', type: 'main' },
    { id: 'returned', name: 'Returned', type: 'main' },
    { id: 'end', name: 'End', type: 'end' }
  ],
  edges: [
    { source: 'start', target: 'order-received' },
    { source: 'order-received', target: 'validated', label: 'Valid Order' },
    { source: 'order-received', target: 'rejected', label: 'Invalid Order' },
    { source: 'validated', target: 'pending', label: 'Store Order' },
    { source: 'pending', target: 'consolidated', label: 'Group with Others' },
    { source: 'consolidated', target: 'vehicle-assigned', label: 'Assign Vehicle' },
    { source: 'vehicle-assigned', target: 'route-optimized', label: 'Plan Route' },
    { source: 'route-optimized', target: 'dispatched', label: 'Send to Driver' },
    { source: 'dispatched', target: 'in-transit', label: 'Driver Starts' },
    { source: 'in-transit', target: 'at-location', label: 'Arrive at Customer' },
    { source: 'at-location', target: 'delivered', label: 'Successful Delivery' },
    { source: 'at-location', target: 'failed', label: 'Delivery Failed' },
    { source: 'failed', target: 'rescheduled', label: 'Retry Later' },
    { source: 'failed', target: 'returned', label: 'Return to Depot' },
    { source: 'delivered', target: 'end' },
    { source: 'returned', target: 'end' },
    { source: 'rejected', target: 'end' },
    { source: 'rescheduled', target: 'pending' }
  ]
};