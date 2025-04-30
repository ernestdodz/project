import React, { useState } from 'react';
import Button from './ui/Button';
import { LogIn } from 'lucide-react';

interface RoomFormProps {
  onJoin: (roomId: string) => void;
  disabled?: boolean;
}

const RoomForm: React.FC<RoomFormProps> = ({ onJoin, disabled = false }) => {
  const [roomId, setRoomId] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="w-full px-4 py-2 rounded bg-gray-600 border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>
      <Button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 w-full"
        disabled={disabled || !roomId.trim()}
      >
        <LogIn className="mr-2 h-5 w-5" />
        Join Room
      </Button>
    </form>
  );
};

export default RoomForm;