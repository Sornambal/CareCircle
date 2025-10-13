import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (userId, onNotification) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (userId) {
      // Connect to Socket.IO server
      socketRef.current = io('http://localhost:5000');

      // Join user-specific room
      socketRef.current.emit('join-user-room', userId);

      // Listen for SOS notifications
      socketRef.current.on('sos-notification', (data) => {
        console.log('Received SOS notification:', data);
        if (onNotification) {
          onNotification(data);
        }
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [userId, onNotification]);

  return socketRef.current;
};

export default useSocket;
