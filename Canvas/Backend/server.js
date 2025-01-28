import { WebSocketServer } from "ws";
import express from "express";
import { createServer } from "http";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Data structure to store room states
const rooms = new Map();

wss.on("connection", (ws) => {
  let currentRoom = null;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "join":
        // Handle room joining
        currentRoom = data.roomId;
        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, {
            clients: new Set(),
            paths: [], // Store drawing paths for undo/redo
            redoStack: [], // Store redo stack
          });
        }
        rooms.get(currentRoom).clients.add(ws);

        // Broadcast updated user count
        const userCount = rooms.get(currentRoom).clients.size;
        rooms.get(currentRoom).clients.forEach((client) => {
          client.send(JSON.stringify({ type: "userCount", count: userCount }));
        });
        break;

      case "draw":
        // Handle drawing
        if (currentRoom && rooms.has(currentRoom)) {
          const room = rooms.get(currentRoom);
          room.paths.push({
            points: data.path,
            color: data.color,
            width: data.width,
          });
          room.redoStack = []; // Clear redo stack on new draw

          // Broadcast the drawing action to other clients
          room.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(message.toString());
            }
          });
        }
        break;

      case "undo":
        // Handle undo
        if (currentRoom && rooms.has(currentRoom)) {
          const room = rooms.get(currentRoom);
          if (room.paths.length > 0) {
            const undonePath = room.paths.pop();
            room.redoStack.push(undonePath);

            // Broadcast the updated paths and redo stack to all clients
            const payload = {
              type: "undo",
              paths: room.paths,
              redoStack: room.redoStack,
            };
            room.clients.forEach((client) => {
              client.send(JSON.stringify(payload));
            });
          }
        }
        break;

      case "redo":
        // Handle redo
        if (currentRoom && rooms.has(currentRoom)) {
          const room = rooms.get(currentRoom);
          if (room.redoStack.length > 0) {
            const redonePath = room.redoStack.pop();
            room.paths.push(redonePath);

            // Broadcast the updated paths and redo stack to all clients
            const payload = {
              type: "redo",
              paths: room.paths,
              redoStack: room.redoStack,
            };
            room.clients.forEach((client) => {
              client.send(JSON.stringify(payload));
            });
          }
        }
        break;

      case "clear":
        // Handle canvas clearing
        if (currentRoom && rooms.has(currentRoom)) {
          const room = rooms.get(currentRoom);
          room.paths = [];
          room.redoStack = [];

          // Broadcast the clear action to all clients
          room.clients.forEach((client) => {
            client.send(message.toString());
          });
        }
        break;
    }
  });

  ws.on("close", () => {
    // Handle client disconnection
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.clients.delete(ws);

      // Update user count for remaining clients
      const userCount = room.clients.size;
      room.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "userCount", count: userCount }));
      });

      // Remove the room if no clients are left
      if (room.clients.size === 0) {
        rooms.delete(currentRoom);
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});
