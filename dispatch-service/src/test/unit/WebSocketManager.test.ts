import { WebSocketManager, WebSocketEvent, NotificationType } from '../../services/WebSocketManager';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Mock socket.io
jest.mock('socket.io', () => {
  const mockEmit = jest.fn();
  const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
  const mockOn = jest.fn();
  const mockJoin = jest.fn();
  const mockLeave = jest.fn();

  const mockSocket = {
    id: 'test-socket-id',
    on: mockOn,
    join: mockJoin,
    leave: mockLeave,
  };

  const MockServer = jest.fn().mockImplementation(() => {
    return {
      on: (event: string, callback: Function) => {
        if (event === 'connect') {
          callback(mockSocket);
        }
      },
      to: mockTo,
    };
  });

  return {
    Server: MockServer,
    mockEmit,
    mockTo,
    mockOn,
    mockSocket,
  };
});

// Mock http server
jest.mock('http', () => {
  const mockListen = jest.fn((port, callback) => callback());

  return {
    createServer: jest.fn().mockImplementation(() => {
      return {
        listen: mockListen,
      };
    }),
    mockListen,
  };
});

describe('WebSocketManager', () => {
  let webSocketManager: WebSocketManager;
  const mockPort = 3014;

  beforeEach(() => {
    jest.clearAllMocks();
    webSocketManager = new WebSocketManager(mockPort);
  });

  it('should initialize correctly', () => {
    expect(createServer).toHaveBeenCalled();
    expect(Server).toHaveBeenCalled();
    expect(require('http').mockListen).toHaveBeenCalledWith(mockPort, expect.any(Function));
  });

  it('should set up event handlers on connection', () => {
    expect(require('socket.io').mockSocket.on).toHaveBeenCalledWith(
      WebSocketEvent.JOIN_DISPATCH_ROOM,
      expect.any(Function)
    );
    expect(require('socket.io').mockSocket.on).toHaveBeenCalledWith(
      WebSocketEvent.LEAVE_DISPATCH_ROOM,
      expect.any(Function)
    );
    expect(require('socket.io').mockSocket.on).toHaveBeenCalledWith(
      WebSocketEvent.DISCONNECT,
      expect.any(Function)
    );
  });

  it('should broadcast location updates', () => {
    const locationUpdate = {
      dispatchId: 'test-dispatch-id',
      vehicleId: 'test-vehicle-id',
      location: { latitude: 40.7128, longitude: -74.0060 },
      timestamp: new Date(),
    };

    webSocketManager.broadcastLocationUpdate(locationUpdate);

    expect(require('socket.io').mockTo).toHaveBeenCalledWith(`dispatch:${locationUpdate.dispatchId}`);
    expect(require('socket.io').mockEmit).toHaveBeenCalledWith(
      WebSocketEvent.LOCATION_UPDATE,
      locationUpdate
    );
  });

  it('should broadcast dispatch status changes', () => {
    const statusChange = {
      dispatchId: 'test-dispatch-id',
      previousStatus: 'pending',
      newStatus: 'active',
      timestamp: new Date(),
    };

    webSocketManager.broadcastDispatchStatusChange(statusChange);

    expect(require('socket.io').mockTo).toHaveBeenCalledWith(`dispatch:${statusChange.dispatchId}`);
    expect(require('socket.io').mockEmit).toHaveBeenCalledWith(
      WebSocketEvent.DISPATCH_STATUS_CHANGE,
      statusChange
    );
  });

  it('should broadcast critical notifications', () => {
    const notification = {
      dispatchId: 'test-dispatch-id',
      type: NotificationType.DELAY,
      message: 'Delivery will be delayed by 15 minutes',
      timestamp: new Date(),
    };

    webSocketManager.broadcastCriticalNotification(notification);

    expect(require('socket.io').mockTo).toHaveBeenCalledWith(`dispatch:${notification.dispatchId}`);
    expect(require('socket.io').mockEmit).toHaveBeenCalledWith(
      WebSocketEvent.CRITICAL_NOTIFICATION,
      notification
    );
  });
});