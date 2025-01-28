import { useState } from "react";
import Canvas from "./components/Canvas";
import RoomJoin from "./components/RoomJoin";

function App() {
  const [roomId, setRoomId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {!roomId ? (
        <RoomJoin onJoinRoom={setRoomId} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Collaborative Drawing Canvas
              </h1>
              <p className="text-gray-600">Room ID: {roomId}</p>
            </div>
            <button
              onClick={() => setRoomId(null)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Leave Room
            </button>
          </div>
          <Canvas roomId={roomId} />
        </div>
      )}
    </div>
  );
}

export default App;
