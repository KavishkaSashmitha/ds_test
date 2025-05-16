import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

// Initialize socket connection
export const initializeSocket = (token?: string) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
};

// Get the existing socket or create a new one
export const getSocket = (token?: string) => {
  if (!socket || !socket.connected) {
    return initializeSocket(token);
  }
  return socket;
};

// Disconnect the socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Subscribe to delivery location updates
export const subscribeToLocationUpdates = (deliveryId: string, callback: Function) => {
  const s = getSocket();
  if (!s) return () => {};
  
  // First tell the server we want to subscribe to this delivery
  s.emit('subscribe_to_delivery', deliveryId);
  
  // Listen for updates for this specific delivery
  const handleLocationUpdate = (data: any) => {
    if (data.deliveryId === deliveryId) {
      callback(data);
    }
  };
  
  // Listen for status updates
  const handleStatusUpdate = (data: any) => {
    if (data.deliveryId === deliveryId) {
      callback({
        ...data,
        type: 'status_update'
      });
    }
  };
  
  s.on('location_update', handleLocationUpdate);
  s.on('delivery_status_update', handleStatusUpdate);
  
  // Return unsubscribe function
  return () => {
    if (s) {
      s.emit('unsubscribe_from_delivery', deliveryId);
      s.off('location_update', handleLocationUpdate);
      s.off('delivery_status_update', handleStatusUpdate);
    }
  };
};

// Send driver location update (for delivery personnel)
export const sendLocationUpdate = (data: {
  latitude: number;
  longitude: number;
  deliveryId?: string;
}) => {
  const s = getSocket();
  if (s) {
    s.emit('location_update', data);
  }
};

// Get live location without socket connection (using REST API)
export const fetchDriverLocation = async (orderId: string) => {
  try {
    const response = await fetch(`/api/delivery/public/locations/order/${orderId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching driver location: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching driver location:', error);
    throw error;
  }
};
