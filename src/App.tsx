import React from 'react';
import { VideoChat } from './components/VideoChat';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-400">WebRTC Video Chat</h1>
          <p className="text-gray-300">Connect with others in real-time using your camera and microphone</p>
        </header>
        <VideoChat />
      </div>
    </div>
  );
}

export default App;