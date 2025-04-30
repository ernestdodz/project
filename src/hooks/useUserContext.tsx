import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";

interface UserContextType {
  userId: string;
  isCreator: (roomId: string | null) => boolean;
  markRoomAsCreated: (roomId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [userId, setUserId] = useState<string>("");
  const [createdRooms, setCreatedRooms] = useState<Set<string>>(new Set());

  // Initialize user ID on first load
  useEffect(() => {
    // Try to get existing user ID from localStorage
    const storedUserId = localStorage.getItem("videoChat_userId");

    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Generate a new user ID if none exists
      const newUserId = uuidv4();
      setUserId(newUserId);
      localStorage.setItem("videoChat_userId", newUserId);
    }

    // Try to get created rooms from localStorage
    const storedRooms = localStorage.getItem("videoChat_createdRooms");
    if (storedRooms) {
      try {
        const roomsArray = JSON.parse(storedRooms);
        setCreatedRooms(new Set(roomsArray));
      } catch (e) {
        console.error("Error parsing stored rooms:", e);
        // Reset if there's an error
        localStorage.setItem("videoChat_createdRooms", JSON.stringify([]));
      }
    }
  }, []);

  // Function to mark a room as created by this user
  const markRoomAsCreated = (roomId: string) => {
    const updatedRooms = new Set(createdRooms);
    updatedRooms.add(roomId);
    setCreatedRooms(updatedRooms);
    localStorage.setItem(
      "videoChat_createdRooms",
      JSON.stringify([...updatedRooms])
    );
  };

  // Function to check if user is the creator of a room
  const isCreator = (roomId: string | null): boolean => {
    if (!roomId) return false;
    return createdRooms.has(roomId);
  };

  const value = {
    userId,
    isCreator,
    markRoomAsCreated,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
