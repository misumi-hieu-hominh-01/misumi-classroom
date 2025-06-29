"use client";

import { useState } from "react";
import { Vector3 } from "three";
import { Checkpoint } from "./CheckpointSystem";

interface CheckpointHelperProps {
  characterPosition: Vector3;
  onAddCheckpoint?: (checkpoint: Checkpoint) => void;
  onPreviewSizeChange?: (size: {
    width: number;
    height: number;
    depth: number;
  }) => void;
}

// Component để hiển thị preview checkpoint box
export function PreviewCheckpointBox({
  position,
  size,
  type,
}: {
  position: Vector3;
  size: { width: number; height: number; depth: number };
  type: "seat" | "desk" | "board" | "door" | "custom";
}) {
  const groundLevel = -1.2;
  const checkpointBoxCenterY = groundLevel + size.height / 2;

  const getColorByType = (type: string) => {
    switch (type) {
      case "seat":
        return "green";
      case "desk":
        return "yellow";
      case "board":
        return "blue";
      case "door":
        return "red";
      default:
        return "purple";
    }
  };

  return (
    <mesh position={[position.x, checkpointBoxCenterY, position.z]}>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshBasicMaterial
        color={getColorByType(type)}
        transparent
        opacity={0.4}
        wireframe
      />
    </mesh>
  );
}

export default function CheckpointHelper({
  characterPosition,
  onAddCheckpoint,
  onPreviewSizeChange,
}: CheckpointHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boxSize, setBoxSize] = useState({ width: 1, height: 2, depth: 1 });
  const [checkpointName, setCheckpointName] = useState("Checkpoint mới");
  const [checkpointId, setCheckpointId] = useState("checkpoint_01");
  const [checkpointType, setCheckpointType] = useState<
    "seat" | "desk" | "board" | "door" | "custom"
  >("seat");
  const [checkpointMessage, setCheckpointMessage] = useState(
    "Bạn đã đến một vị trí đặc biệt!"
  );
  const [cooldown, setCooldown] = useState(3000);

  const handleCreateCheckpoint = () => {
    const pos = characterPosition;
    const min = new Vector3(
      pos.x - boxSize.width / 2,
      pos.y - boxSize.height / 2,
      pos.z - boxSize.depth / 2
    );
    const max = new Vector3(
      pos.x + boxSize.width / 2,
      pos.y + boxSize.height / 2,
      pos.z + boxSize.depth / 2
    );

    const checkpoint: Checkpoint = {
      min,
      max,
      name: checkpointName,
      id: checkpointId,
      type: checkpointType,
      message: checkpointMessage,
      cooldown,
    };

    if (onAddCheckpoint) {
      onAddCheckpoint(checkpoint);
    }

    // Generate checkpoint code
    const checkpointCode = `  {
    min: new Vector3(${min.x.toFixed(1)}, ${min.y.toFixed(1)}, ${min.z.toFixed(
      1
    )}),
    max: new Vector3(${max.x.toFixed(1)}, ${max.y.toFixed(1)}, ${max.z.toFixed(
      1
    )}),
    name: "${checkpointName}",
    id: "${checkpointId}",
    type: "${checkpointType}",
    message: "${checkpointMessage}",
    cooldown: ${cooldown},
  },`;

    navigator.clipboard.writeText(checkpointCode);
    alert("Checkpoint code copied to clipboard!");
  };

  const presetCheckpoints = [
    {
      name: "Ghế học sinh",
      id: "seat_",
      width: 1,
      height: 2,
      depth: 1,
      type: "seat" as const,
      message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
      cooldown: 3000,
    },
    {
      name: "Bàn học",
      id: "desk_",
      width: 2,
      height: 1.5,
      depth: 1.2,
      type: "desk" as const,
      message: "📚 Bạn đã đến bàn học! Đây là nơi làm bài tập.",
      cooldown: 3000,
    },
    {
      name: "Bảng đen",
      id: "board_",
      width: 4,
      height: 2,
      depth: 2,
      type: "board" as const,
      message: "📝 Bạn đã đến bảng đen! Nơi giáo viên truyền đạt kiến thức.",
      cooldown: 5000,
    },
    {
      name: "Cửa phòng",
      id: "door_",
      width: 1.5,
      height: 3,
      depth: 0.5,
      type: "door" as const,
      message: "🚪 Bạn đã đến cửa ra vào! Hãy cẩn thận khi di chuyển.",
      cooldown: 2000,
    },
  ];

  const applyPreset = (preset: (typeof presetCheckpoints)[0]) => {
    setBoxSize({
      width: preset.width,
      height: preset.height,
      depth: preset.depth,
    });
    setCheckpointName(preset.name);
    setCheckpointId(preset.id + Date.now());
    setCheckpointType(preset.type);
    setCheckpointMessage(preset.message);
    setCooldown(preset.cooldown);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-20 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-600 transition-colors"
      >
        📍 Checkpoint Helper
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-20 bg-white/98 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm border border-gray-200 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900">📍 Checkpoint Helper</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-600 hover:text-gray-800 font-bold text-lg"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm text-gray-900">
        {/* Current Position */}
        <div className="bg-purple-50 p-2 rounded border border-purple-200">
          <strong className="text-purple-900">Vị trí hiện tại:</strong>
          <div className="text-xs font-mono text-purple-800 font-semibold">
            X: {characterPosition.x.toFixed(2)}
            <br />
            Y: {characterPosition.y.toFixed(2)}
            <br />
            Z: {characterPosition.z.toFixed(2)}
          </div>
        </div>

        {/* Presets */}
        <div>
          <strong className="text-gray-700">🎯 Presets:</strong>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {presetCheckpoints.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset)}
                className="px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-xs border border-purple-300 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Checkpoint Details */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Tên:
            </label>
            <input
              type="text"
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">
              ID:
            </label>
            <input
              type="text"
              value={checkpointId}
              onChange={(e) => setCheckpointId(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Loại:
            </label>
            <select
              value={checkpointType}
              onChange={(e) =>
                setCheckpointType(
                  e.target.value as
                    | "seat"
                    | "desk"
                    | "board"
                    | "door"
                    | "custom"
                )
              }
              className="w-full px-2 py-1 border rounded text-xs"
            >
              <option value="seat">🪑 Ghế</option>
              <option value="desk">📚 Bàn</option>
              <option value="board">📝 Bảng</option>
              <option value="door">🚪 Cửa</option>
              <option value="custom">⭐ Tùy chỉnh</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Thông báo:
            </label>
            <textarea
              value={checkpointMessage}
              onChange={(e) => setCheckpointMessage(e.target.value)}
              className="w-full px-2 py-1 border rounded text-xs"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">
              Cooldown (ms):
            </label>
            <input
              type="number"
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>

        {/* Size Controls */}
        <div className="space-y-2">
          <strong className="text-gray-700">📏 Kích thước:</strong>

          <div>
            <label className="block text-xs text-gray-600">Width:</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={boxSize.width}
              onChange={(e) => {
                const newSize = { ...boxSize, width: Number(e.target.value) };
                setBoxSize(newSize);
                onPreviewSizeChange?.(newSize);
              }}
              className="w-full"
            />
            <span className="text-xs text-gray-600">
              {boxSize.width.toFixed(1)}
            </span>
          </div>

          <div>
            <label className="block text-xs text-gray-600">Height:</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={boxSize.height}
              onChange={(e) => {
                const newSize = { ...boxSize, height: Number(e.target.value) };
                setBoxSize(newSize);
                onPreviewSizeChange?.(newSize);
              }}
              className="w-full"
            />
            <span className="text-xs text-gray-600">
              {boxSize.height.toFixed(1)}
            </span>
          </div>

          <div>
            <label className="block text-xs text-gray-600">Depth:</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.1"
              value={boxSize.depth}
              onChange={(e) => {
                const newSize = { ...boxSize, depth: Number(e.target.value) };
                setBoxSize(newSize);
                onPreviewSizeChange?.(newSize);
              }}
              className="w-full"
            />
            <span className="text-xs text-gray-600">
              {boxSize.depth.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateCheckpoint}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          📍 Tạo Checkpoint
        </button>
      </div>
    </div>
  );
}
