import { useState } from "react";

export default function RoomJoin({ onJoinRoom }) {
  const [roomInput, setRoomInput] = useState("");

  const createNewRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 7);
    onJoinRoom(newRoomId);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomInput.trim()) {
      onJoinRoom(roomInput.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Join Drawing Room
          </h2>
        </div>
        <form onSubmit={joinRoom} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Enter Room ID"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={createNewRoom}
              className="group relative flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Create New Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
