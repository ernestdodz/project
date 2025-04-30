import { useState, createContext, useContext } from "react";
import { ConnectionStatus } from "../components/VideoChat";

// Initial state
const initialStatus: ConnectionStatus = {
  connected: false,
  initiator: false,
  roomId: null,
};

// Create context
const ConnectionStatusContext = createContext<{
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}>({
  status: initialStatus,
  setStatus: () => {},
});

// Hook
export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);

  return {
    status,
    setStatus,
  };
};

export default ConnectionStatusContext;
