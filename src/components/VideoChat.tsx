import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Peer, MediaConnection } from "peerjs";
import { useParams, useNavigate } from "react-router-dom";
import {
  Video,
  UserPlus,
  UserMinus,
  Copy,
  Check,
  Camera,
  RefreshCw,
  Mic,
  MicOff,
  VideoOff,
  Share,
} from "lucide-react";
import RoomForm from "./RoomForm";
import VideoDisplay from "./VideoDisplay";
import Button from "./ui/Button";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useUser } from "../hooks/useUserContext";

export interface ConnectionStatus {
  connected: boolean;
  initiator: boolean;
  roomId: string | null;
}

interface VideoChatProps {
  mode?: "create" | "join";
}

export const VideoChat: React.FC<VideoChatProps> = ({ mode }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const callRef = useRef<MediaConnection | null>(null);

  // Router hooks
  const params = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  // User context
  const { userId } = useUser();

  const { status, setStatus } = useConnectionStatus();

  const startCamera = useCallback(async () => {
    if (localStream) return localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Initialize tracks based on current state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isMicEnabled;
      });

      stream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraEnabled;
      });

      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera or microphone. Please check permissions.");
      return null;
    }
  }, [localStream, isMicEnabled, isCameraEnabled]);

  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  // Initialize peer connection
  useEffect(() => {
    // Generate a unique ID for this peer that will also be used as the room ID when creating a room
    const peerId = uuidv4().substring(0, 8);
    console.log("Creating peer with ID:", peerId);

    const myPeer = new Peer(peerId, {
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
      // Store the peer ID so we can use it as the room ID
      setRoomId(id);
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

  const disconnect = useCallback(() => {
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

    // Return to home page when disconnected
    navigate("/", { replace: true });
  }, [callRef, stopCamera, setRemoteStream, setStatus, navigate]);

  const createRoom = useCallback(async () => {
    if (!peer) return;

    // Use the peer's ID as the room ID
    const peerRoomId = peer.id;

    // Start the camera first to ensure it's ready when the room is created
    await startCamera();

    // The room ID is already set when the peer is created,
    // but we'll update the status to indicate we're the initiator
    setStatus({
      connected: false,
      initiator: true,
      roomId: peerRoomId,
    });

    // Update URL to reflect the room ID for deep linking
    navigate(`/room/${peerRoomId}`, { replace: true });

    // Mark this user as the creator of this room and store creator ID with room
    if (typeof window !== "undefined") {
      const createdRooms = JSON.parse(
        localStorage.getItem("videoChat_createdRooms") || "[]"
      );
      if (!createdRooms.includes(peerRoomId)) {
        createdRooms.push(peerRoomId);
        localStorage.setItem(
          "videoChat_createdRooms",
          JSON.stringify(createdRooms)
        );

        // Store the creator's user ID with the room
        localStorage.setItem(`room_${peerRoomId}_creator`, userId);
      }
    }
  }, [peer, setStatus, startCamera, navigate, userId]);

  const joinRoom = useCallback(
    async (id: string) => {
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

        // Update URL to reflect the room ID for deep linking
        navigate(`/room/join/${id}`, { replace: true });

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
          // Return to home page when disconnected
          navigate("/", { replace: true });
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
    },
    [
      peer,
      status.connected,
      setRoomId,
      setRemoteStream,
      setStatus,
      startCamera,
      disconnect,
      navigate,
    ]
  );

  const reconnect = useCallback(() => {
    // Only attempt to reconnect if we were previously in a room
    if (!status.roomId) {
      alert("No previous connection to reconnect to.");
      return;
    }

    // If we were the initiator, we should wait for the other person to join
    if (status.initiator) {
      alert(
        "You created this room. Please wait for the other person to reconnect."
      );
      return;
    }

    // Otherwise, try to rejoin the room
    joinRoom(status.roomId);
  }, [status.roomId, status.initiator, joinRoom]);

  const copyRoomId = () => {
    if (!status.roomId) return;

    navigator.clipboard
      .writeText(status.roomId)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const copyRoomLink = () => {
    if (!status.roomId) return;

    const url = `${window.location.origin}/room/join/${status.roomId}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
      });
  };

  const toggleMicrophone = useCallback(() => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const enabled = !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });

    setIsMicEnabled(enabled);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    const enabled = !videoTracks[0].enabled;
    videoTracks.forEach((track) => {
      track.enabled = enabled;
    });

    setIsCameraEnabled(enabled);
  }, [localStream]);

  // Handle deep linking based on URL parameters and mode
  useEffect(() => {
    if (!peer) return;

    // If we have a roomId in the URL params, use it to join the room
    if (params.roomId && !status.roomId) {
      joinRoom(params.roomId);
    }

    // If mode is 'create', automatically create a room
    if (mode === "create" && !status.roomId) {
      createRoom();
    }

    // If mode is 'join' and we have a roomId in the URL, join that room
    if (mode === "join" && params.roomId && !status.roomId) {
      joinRoom(params.roomId);
    }
  }, [peer, params.roomId, mode, status.roomId, joinRoom, createRoom]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        {status.roomId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {status.connected ? (
                <div className="flex items-center text-green-400">
                  <Check className="mr-2 h-5 w-5" />
                  Connected to room
                </div>
              ) : (
                <div className="flex items-center text-yellow-400">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  {status.initiator
                    ? "Waiting for someone to join..."
                    : "Connecting..."}
                </div>
              )}
              <Button
                onClick={disconnect}
                className="bg-red-500 hover:bg-red-600"
              >
                <UserMinus className="mr-2 h-5 w-5" />
                {status.initiator ? "Close Room" : "Leave Room"}
              </Button>
            </div>

            {status.initiator && !status.connected && (
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="mb-4">
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
                          Copy ID
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400 mb-1">
                    Share Direct Link
                  </h3>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-mono truncate max-w-[200px]">
                      {`${window.location.origin}/room/join/${status.roomId}`}
                    </p>
                    <Button
                      onClick={copyRoomLink}
                      className={`${
                        isLinkCopied
                          ? "bg-green-500"
                          : "bg-blue-500 hover:bg-blue-600"
                      }`}
                    >
                      {isLinkCopied ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Share className="mr-1 h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Camera className="mr-2 h-5 w-5 text-blue-400" />
                    Your Camera
                  </h2>
                  <div className="flex space-x-2">
                    <Button
                      onClick={toggleMicrophone}
                      className={`p-2 ${
                        isMicEnabled
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                      title={
                        isMicEnabled ? "Mute Microphone" : "Unmute Microphone"
                      }
                    >
                      {isMicEnabled ? (
                        <Mic className="h-5 w-5" />
                      ) : (
                        <MicOff className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      onClick={toggleCamera}
                      className={`p-2 ${
                        isCameraEnabled
                          ? "bg-blue-500 hover:bg-blue-600"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                      title={
                        isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"
                      }
                    >
                      {isCameraEnabled ? (
                        <Camera className="h-5 w-5" />
                      ) : (
                        <VideoOff className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                <VideoDisplay stream={localStream} muted />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <UserPlus className="mr-2 h-5 w-5 text-blue-400" />
                  Remote Camera
                </h2>
                <VideoDisplay
                  stream={remoteStream}
                  placeholder={
                    status.initiator
                      ? "Waiting for someone to join..."
                      : "Connecting..."
                  }
                />
              </div>
              ``
            </div>

            {!status.connected && !status.initiator && (
              <div className="mt-4">
                <Button
                  onClick={reconnect}
                  className="bg-yellow-500 hover:bg-yellow-600 w-full flex items-center justify-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconnect to Room
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
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

        {/* Debug information */}
        <div className="mt-4 p-2 bg-gray-700 rounded text-left">
          <p className="text-xs">Debug Info:</p>
          <p className="text-xs">Peer ID: {peer?.id || "Not connected"}</p>
          <p className="text-xs">Room ID: {status.roomId || "None"}</p>
          <p className="text-xs">
            Status: {status.connected ? "Connected" : "Not connected"}{" "}
            {status.initiator ? "(Initiator)" : ""}
          </p>
        </div>
      </div>
    </div>
  );
};
