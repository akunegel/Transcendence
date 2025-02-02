import { useEffect, useContext } from 'react';
import AuthContext from './AuthContext';

const OnlineTracking = () => {
  const { authTokens, user } = useContext(AuthContext);
  let ws = null;

  const connectWebSocket = () => {
    if (!user || !authTokens?.access) return;

    ws = new WebSocket(
      `wss://${window.location.host}/ws/online/?token=${authTokens.access}`
    );

    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);

    ws.onclose = () => {
      clearInterval(heartbeatInterval);
    };

    return () => {
      if (ws) {
        ws.close();
      }
      clearInterval(heartbeatInterval);
    };
  };

  useEffect(() => {
    const cleanup = connectWebSocket();
    return cleanup;
  }, [user, authTokens]);

  return null;
};

export default OnlineTracking;