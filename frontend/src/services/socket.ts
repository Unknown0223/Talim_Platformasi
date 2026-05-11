import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

function socketUrl() {
  return import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5001";
}

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (!socket || socket.disconnected) {
    socket = io(socketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
