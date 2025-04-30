import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Peer, MediaConnection } from "peerjs";
import { Video, UserPlus, UserMinus, Copy, Check, Camera } from "lucide-react";
import RoomForm from "./RoomForm";
import VideoDisplay from "./VideoDisplay";
import Button from "./ui/Button";
import { useConnectionStatus } from "../hooks/useConnectionStatus";

export interface ConnectionStatus {
  connected: boolean;
  initiator: boolean;
  roomId: string | null;
}

export const VideoChat: React.FC = () => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const callRef = useRef<MediaConnection | null>(null);

  const { status, setStatus } = useConnectionStatus();

  const startCamera = useCallback(async () => {
    if (localStream) return localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera or microphone. Please check permissions.");
      return null;
    }
  }, [localStream]);

  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  useEffect(() => {
    const myPeer = new Peer(uuidv4(), {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
          { urls: "stun:stun.global.stun.twilio.com:3478" },
          { urls: "stun:stun.stunprotocol.org:3478" },
        ],
      },
    });

    myPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setPeer(myPeer);
    });

    myPeer.on("error", (err) => {
      console.error("PeerJS error:", err);

      // Provide more specific error messages based on error type
      let errorMessage = `Connection error: ${err.type}`;

      if (err.type === "peer-unavailable") {
        errorMessage =
          "Connection error: The room ID doesn't exist or the other user has disconnected. Please check the room ID and try again.";
      } else if (err.type === "network") {
        errorMessage =
          "Connection error: Network issue detected. Please check your internet connection.";
      } else if (err.type === "server-error") {
        errorMessage =
          "Connection error: Server error. Please try again later.";
      }

      alert(errorMessage);
    });

    return () => {
      myPeer.destroy();
    };
  }, []);

  useEffect(() => {
    if (!peer) return;

    const handleIncomingCall = (call: MediaConnection) => {
      callRef.current = call;

      startCamera().then(() => {
        if (localStream) {
          call.answer(localStream);

          call.on("stream", (incomingStream) => {
            setRemoteStream(incomingStream);
            setStatus({
              connected: true,
              initiator: false,
              roomId: roomId,
            });
          });
        }
      });

      call.on("close", () => {
        setRemoteStream(null);
        setStatus({
          connected: false,
          initiator: false,
          roomId: null,
        });
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        setRemoteStream(null);
        setStatus({
          connected: false,
          initiator: false,
          roomId: null,
        });
      });
    };

    peer.on("call", handleIncomingCall);

    return () => {
      peer.off("call", handleIncomingCall);
    };
  }, [peer, localStream, roomId, setStatus, startCamera]);

  const createRoom = () => {
    if (!peer) return;

    const newRoomId = uuidv4().substring(0, 8);
    setRoomId(newRoomId);

    setStatus({
      connected: false,
      initiator: true,
      roomId: newRoomId,
    });

    startCamera();
  };

  const joinRoom = async (id: string) => {
    if (!peer) return;

    // Validate room ID
    if (!id || id.trim() === "") {
      alert("Please enter a valid room ID");
      return;
    }

    setRoomId(id);

    try {
      const stream = await startCamera();
      if (!stream) return;

      const call = peer.call(id, stream);
      callRef.current = call;

      // Set a timeout to detect if the connection fails
      const connectionTimeout = setTimeout(() => {
        if (!status.connected) {
          alert(
            "Connection timed out. The room ID may be invalid or the other user is not available."
          );
          disconnect();
        }
      }, 10000); // 10 seconds timeout

      call.on("stream", (incomingStream) => {
        clearTimeout(connectionTimeout);
        setRemoteStream(incomingStream);
        setStatus({
          connected: true,
          initiator: false,
          roomId: id,
        });
      });

      call.on("close", () => {
        clearTimeout(connectionTimeout);
        setRemoteStream(null);
        setStatus({
          connected: false,
          initiator: false,
          roomId: null,
        });
      });

      call.on("error", (err) => {
        clearTimeout(connectionTimeout);
        console.error("Call error:", err);
        alert(`Call error: ${err}`);
        disconnect();
      });
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Failed to join room. Please try again.");
      disconnect();
    }
  };

  const disconnect = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    stopCamera();
    setRemoteStream(null);
    setStatus({
      connected: false,
      initiator: false,
      roomId: null,
    });
  };

  const copyRoomId = () => {
    if (!roomId) return;

    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        {status.connected ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-400">
                <Check className="mr-2 h-5 w-5" />
                Connected to room
              </div>
              <Button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600"
              >
                <UserMinus className="mr-2 h-5 w-5" />
                Leave Room
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Camera className="mr-2 h-5 w-5 text-blue-400" />
                  Your Camera
                </h2>
                <VideoDisplay stream={localStream} muted />
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-blue-400" />
                  Remote Camera
                </h2>
                <VideoDisplay
                  stream={remoteStream}
                  placeholder="Connecting..."
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {status.roomId && status.initiator && (
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm text-gray-400 mb-1">
                      Room ID (Share this to invite someone)
                    </h3>
                    <p className="text-xl font-mono">{status.roomId}</p>
                  </div>
                  <Button
                    onClick={copyRoomId}
                    className={`${
                      isCopied
                        ? "bg-green-500"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Video className="mr-2 h-5 w-5 text-blue-400" />
                  Create a New Room
                </h3>
                <p className="mb-4 text-gray-300 text-sm">
                  Start a new room and share the ID with someone to connect.
                </p>
                <Button
                  onClick={createRoom}
                  className="bg-blue-500 hover:bg-blue-600 w-full"
                  disabled={!!status.roomId}
                >
                  Create Room
                </Button>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-blue-400" />
                  Join Existing Room
                </h3>
                <RoomForm onJoin={joinRoom} />
              </div>
            </div>
          </div>
        )}
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
  );
};
