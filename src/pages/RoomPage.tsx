import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { VideoChat } from "../components/VideoChat";
import { Home } from "lucide-react";
import Button from "../components/ui/Button";

const RoomPage: React.FC = () => {
  const { roomId: urlRoomId } = useParams<{ roomId?: string }>();
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Handle roomId from URL for deep linking
  useEffect(() => {
    if (urlRoomId) {
      // Set a flag that we're joining a room from URL
      setIsJoiningRoom(true);

      // Update the document title with the room ID
      document.title = `Room: ${urlRoomId} | WebRTC Video Chat`;
    } else {
      document.title = "Video Chat Room | WebRTC Video Chat";
    }
  }, [urlRoomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-blue-400">
              WebRTC Video Chat
            </h1>
            <p className="text-gray-300">
              Connect with others in real-time using your camera and microphone
            </p>
          </div>
          <Link to="/">
            <Button className="bg-gray-700 hover:bg-gray-600">
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
          </Link>
        </header>

        {/* Pass the URL roomId to the VideoChat component */}
        <VideoChat initialRoomId={urlRoomId} autoJoin={isJoiningRoom} />
      </div>
    </div>
  );
};

export default RoomPage;
