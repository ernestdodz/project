import React from "react";
import { Link } from "react-router-dom";
import { Video, Users, ArrowRight, Check } from "lucide-react";
import Button from "../components/ui/Button";

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3 text-blue-400">
            WebRTC Video Chat
          </h1>
          <p className="text-xl text-gray-300">
            Connect with others in real-time using your camera and microphone
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center text-blue-400 mb-2">
                  <Video className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-semibold">
                    Real-time Video Chat
                  </h2>
                </div>
                <p className="text-gray-300">
                  Connect instantly with friends, family, or colleagues using
                  our secure peer-to-peer video chat platform. No registration
                  required!
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <div className="bg-blue-500 rounded-full p-1 mr-3">
                      <Check className="h-4 w-4" />
                    </div>
                    Secure peer-to-peer connection
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-500 rounded-full p-1 mr-3">
                      <Check className="h-4 w-4" />
                    </div>
                    No account needed
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-500 rounded-full p-1 mr-3">
                      <Check className="h-4 w-4" />
                    </div>
                    Works across all modern browsers
                  </li>
                </ul>
              </div>

              <div className="bg-gray-700 rounded-lg p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center text-blue-400 mb-4">
                    <Users className="h-7 w-7 mr-2" />
                    <h3 className="text-xl font-semibold">
                      Start Chatting Now
                    </h3>
                  </div>
                  <p className="text-gray-300 mb-6">
                    Create a new room and invite others, or join an existing
                    room with a room ID.
                  </p>
                </div>
                <Link to="/room" className="w-full">
                  <Button className="bg-blue-500 hover:bg-blue-600 w-full text-lg py-3">
                    Go to Video Chat
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <p>
              This app works locally across different browser tabs on the same
              device.
            </p>
            <p className="mt-1">
              Open a second browser window to test the connection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
