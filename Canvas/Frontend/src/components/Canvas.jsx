import { useEffect, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";
import { toPng, toSvg } from "html-to-image";

const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  return `${d.join(" ")} Z`;
};

export default function Canvas({ roomId }) {
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [paths, setPaths] = useState([]);
  const [redoStack, setRedoStack] = useState([]); // For redo functionality
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [userCount, setUserCount] = useState(1);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      ws.send(JSON.stringify({ type: "join", roomId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "draw":
          setPaths((prev) => [
            ...prev,
            {
              points: data.path,
              color: data.color,
              width: data.width,
            },
          ]);
          break;
        case "undo":
          setPaths(data.paths);
          setRedoStack(data.redoStack);
          break;
        case "redo":
          setPaths(data.paths);
          setRedoStack(data.redoStack);
          break;
        case "clear":
          setPaths([]);
          setRedoStack([]);
          break;
        case "userCount":
          setUserCount(data.count);
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const broadcastAction = (type, payload) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    }
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCurrentPath([[offsetX, offsetY]]);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    setCurrentPath((prev) => [...prev, [offsetX, offsetY]]);
  };

  const endDrawing = () => {
    if (currentPath.length > 0) {
      const newPath = { points: currentPath, color, width: strokeWidth };
      setPaths((prev) => [...prev, newPath]);
      setRedoStack([]); // Clear redo stack on new action
      broadcastAction("draw", { path: currentPath, color, width: strokeWidth });
    }
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const undo = () => {
    if (paths.length === 0) return;
    const newPaths = [...paths];
    const undonePath = newPaths.pop();
    setPaths(newPaths);
    setRedoStack((prev) => [undonePath, ...prev]);
    broadcastAction("undo", {
      paths: newPaths,
      redoStack: [undonePath, ...redoStack],
    });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const newRedoStack = [...redoStack];
    const redonePath = newRedoStack.shift();
    setPaths((prev) => [...prev, redonePath]);
    setRedoStack(newRedoStack);
    broadcastAction("redo", {
      paths: [...paths, redonePath],
      redoStack: newRedoStack,
    });
  };

  const clearCanvas = () => {
    setPaths([]);
    setRedoStack([]);
    broadcastAction("clear", {});
  };

  const exportToPNG = async () => {
    try {
      const dataUrl = await toPng(canvasRef.current);
      const link = document.createElement("a");
      link.download = "drawing.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting to PNG:", err);
    }
  };

  const exportToSVG = async () => {
    try {
      const dataUrl = await toSvg(canvasRef.current);
      const link = document.createElement("a");
      link.download = "drawing.svg";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting to SVG:", err);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPath = (pathData) => {
      const stroke = getStroke(pathData.points, {
        size: pathData.width || 5,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      });

      ctx.beginPath();
      ctx.fillStyle = pathData.color || "#000000";
      const pathString = getSvgPathFromStroke(stroke);
      const path2D = new Path2D(pathString);
      ctx.fill(path2D);
    };

    paths.forEach(drawPath);
    if (currentPath.length > 0) {
      drawPath({ points: currentPath, color, width: strokeWidth });
    }
  }, [paths, currentPath, color, strokeWidth]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Users Online: {userCount}
          </span>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={undo}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Undo
        </button>
        <button
          onClick={redo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Redo
        </button>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear Canvas
        </button>
        <button
          onClick={exportToPNG}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export PNG
        </button>
        <button
          onClick={exportToSVG}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export SVG
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        className="border border-gray-300 rounded-lg shadow-lg bg-white cursor-crosshair"
      />
    </div>
  );
}
