import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VideoChat } from "./components/VideoChat";
import { UserProvider } from "./hooks/useUserContext";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4 py-8">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2 text-blue-400">
                WebRTC Video Chat
              </h1>
              <p className="text-gray-300">
                Connect with others in real-time using your camera and
                microphone
              </p>
            </header>
            <Routes>
              <Route path="/" element={<VideoChat />} />
              <Route path="/room/:roomId" element={<VideoChat />} />
              <Route
                path="/room/create"
                element={<VideoChat mode="create" />}
              />
              <Route
                path="/room/join/:roomId"
                element={<VideoChat mode="join" />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
