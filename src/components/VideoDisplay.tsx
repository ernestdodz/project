import React from 'react';
import { useVideoRef } from '../hooks/useVideoRef';

interface VideoDisplayProps {
  stream: MediaStream | null;
  muted?: boolean;
  placeholder?: string;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({ 
  stream, 
  muted = false,
  placeholder = "No video"
}) => {
  const videoRef = useVideoRef(stream);
  
  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-700 aspect-video w-full">
      {stream ? (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <p>{placeholder}</p>
        </div>
      )}
    </div>
  );
};

export default VideoDisplay;