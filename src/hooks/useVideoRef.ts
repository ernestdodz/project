import { useRef, useEffect } from 'react';

export const useVideoRef = (stream: MediaStream | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  
  return videoRef;
};