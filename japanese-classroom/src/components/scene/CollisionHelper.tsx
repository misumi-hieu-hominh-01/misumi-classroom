"use client";

import { useState } from "react";
import { Vector3 } from "three";

interface CollisionHelperProps {
  characterPosition: Vector3;
  onAddCollisionBox?: (min: Vector3, max: Vector3, name: string) => void;
  onPreviewSizeChange?: (size: {
    width: number;
    height: number;
    depth: number;
  }) => void;
}

// Component để hiển thị preview collision box
export function PreviewCollisionBox({
  position,
  size,
}: {
  position: Vector3;
  size: { width: number; height: number; depth: number };
}) {
  // Nhân vật có Y offset = -1.2 và đứng trên ground
  // Collision box nên có bottom ở ground level và center ở giữa height
  // Ground level ở đây là Y = -1.2, vậy center của collision box sẽ là:
  const groundLevel = -1.2; // Cùng level với chân nhân vật
  const collisionBoxCenterY = groundLevel + size.height / 2;

  return (
    <mesh position={[position.x, collisionBoxCenterY, position.z]}>
      <boxGeometry args={[size.width, size.height, size.depth]} />
      <meshBasicMaterial color="black" transparent opacity={0.5} wireframe />
    </mesh>
  );
}

export default function CollisionHelper({
  characterPosition,
  onAddCollisionBox,
  onPreviewSizeChange,
}: CollisionHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boxSize, setBoxSize] = useState({ width: 2, height: 2, depth: 2 });
  const [boxName, setBoxName] = useState("new-collision");
  const [boxType, setBoxType] = useState<"wall" | "furniture" | "height">(
    "furniture"
  );
  const [heightValue, setHeightValue] = useState(0.5);

  const handleCreateBox = () => {
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

    if (onAddCollisionBox) {
      onAddCollisionBox(min, max, boxName);
    }

    // Generate different code based on type
    let collisionCode = "";
    if (boxType === "height") {
      collisionCode = `  {
    min: new Vector3(${min.x.toFixed(1)}, ${min.y.toFixed(1)}, ${min.z.toFixed(
        1
      )}),
    max: new Vector3(${max.x.toFixed(1)}, ${max.y.toFixed(1)}, ${max.z.toFixed(
        1
      )}),
    name: "${boxName}",
    type: "height",
    height: ${heightValue},
  },`;
    } else {
      collisionCode = `  {
    min: new Vector3(${min.x.toFixed(1)}, ${min.y.toFixed(1)}, ${min.z.toFixed(
        1
      )}),
    max: new Vector3(${max.x.toFixed(1)}, ${max.y.toFixed(1)}, ${max.z.toFixed(
        1
      )}),
    name: "${boxName}",
    type: "${boxType}",
  },`;
    }

    navigator.clipboard.writeText(collisionCode);
    alert(
      `${
        boxType === "height" ? "Height zone" : "Collision box"
      } code copied to clipboard!`
    );
  };

  const presetBoxes: Array<{
    name: string;
    width: number;
    height: number;
    depth: number;
    type: "wall" | "furniture" | "height";
    heightValue?: number;
  }> = [
    {
      name: "bàn học sinh",
      width: 2,
      height: 1.5,
      depth: 1.2,
      type: "furniture" as const,
    },
    {
      name: "ghế",
      width: 0.8,
      height: 1.8,
      depth: 0.8,
      type: "furniture" as const,
    },
    {
      name: "bàn giảng",
      width: 3,
      height: 1.5,
      depth: 1.5,
      type: "furniture" as const,
    },
    { name: "tường", width: 1, height: 8, depth: 15, type: "wall" as const },
    {
      name: "bục giảng",
      width: 4,
      height: 0.5,
      depth: 3,
      type: "height" as const,
      heightValue: 0.3, // Offset từ ground level
    },
    {
      name: "cầu thang",
      width: 2,
      height: 1,
      depth: 8,
      type: "height" as const,
      heightValue: 0.8, // Offset từ ground level
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-20 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 transition-colors"
      >
        🔧 Collision Helper
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-20 bg-white/98 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900">🔧 Collision Helper</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-600 hover:text-gray-800 font-bold text-lg"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm text-gray-900">
        {/* Current Position */}
        <div className="bg-blue-50 p-2 rounded border border-blue-200">
          <strong className="text-blue-900">Vị trí hiện tại:</strong>
          <div className="text-xs font-mono text-blue-800 font-semibold">
            X: {characterPosition.x.toFixed(2)}
            <br />
            Y: {characterPosition.y.toFixed(2)}
            <br />
            Z: {characterPosition.z.toFixed(2)}
          </div>
          <button
            onClick={() => {
              const pos = `Position: (${characterPosition.x.toFixed(
                2
              )}, ${characterPosition.y.toFixed(
                2
              )}, ${characterPosition.z.toFixed(2)})`;
              navigator.clipboard.writeText(pos);
              alert("Position copied!");
            }}
            className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
          >
            Copy Position
          </button>
        </div>

        {/* Preview Info */}
        <div className="bg-gray-50 p-2 rounded border border-gray-200">
          <strong className="text-gray-800">📦 Preview:</strong>
          <div className="text-xs text-gray-700">
            Collision box màu đen hiển thị xung quanh nhân vật
          </div>
        </div>

        {/* Box Name */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1">
            Tên collision box:
          </label>
          <input
            type="text"
            value={boxName}
            onChange={(e) => setBoxName(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 font-medium"
            placeholder="vd: desk-row1-left"
          />
        </div>

        {/* Preset Buttons */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1">
            Presets:
          </label>
          <div className="grid grid-cols-2 gap-1">
            {presetBoxes.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  const newSize = {
                    width: preset.width,
                    height: preset.height,
                    depth: preset.depth,
                  };
                  setBoxSize(newSize);
                  setBoxName(preset.name);
                  setBoxType(preset.type);
                  if (
                    preset.type === "height" &&
                    preset.heightValue !== undefined
                  ) {
                    setHeightValue(preset.heightValue);
                  }
                  onPreviewSizeChange?.(newSize);
                }}
                className="px-2 py-1 bg-gray-300 text-gray-900 text-xs rounded hover:bg-gray-400 font-medium border border-gray-400"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Box Size */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1">
            Kích thước box:
          </label>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-xs text-gray-800 font-medium">W:</label>
              <input
                type="number"
                step="0.1"
                value={boxSize.width}
                onChange={(e) => {
                  const newSize = { ...boxSize, width: +e.target.value };
                  setBoxSize(newSize);
                  onPreviewSizeChange?.(newSize);
                }}
                className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="text-xs text-gray-800 font-medium">H:</label>
              <input
                type="number"
                step="0.1"
                value={boxSize.height}
                onChange={(e) => {
                  const newSize = { ...boxSize, height: +e.target.value };
                  setBoxSize(newSize);
                  onPreviewSizeChange?.(newSize);
                }}
                className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="text-xs text-gray-800 font-medium">D:</label>
              <input
                type="number"
                step="0.1"
                value={boxSize.depth}
                onChange={(e) => {
                  const newSize = { ...boxSize, depth: +e.target.value };
                  setBoxSize(newSize);
                  onPreviewSizeChange?.(newSize);
                }}
                className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-gray-900 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Box Type Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1">
            Loại collision:
          </label>
          <div className="grid grid-cols-1 gap-1">
            <label className="flex items-center text-xs">
              <input
                type="radio"
                name="boxType"
                value="furniture"
                checked={boxType === "furniture"}
                onChange={(e) =>
                  setBoxType(e.target.value as "wall" | "furniture" | "height")
                }
                className="mr-1"
              />
              <span className="text-gray-800">Furniture (vàng)</span>
            </label>
            <label className="flex items-center text-xs">
              <input
                type="radio"
                name="boxType"
                value="wall"
                checked={boxType === "wall"}
                onChange={(e) =>
                  setBoxType(e.target.value as "wall" | "furniture" | "height")
                }
                className="mr-1"
              />
              <span className="text-gray-800">Wall (đỏ)</span>
            </label>
            <label className="flex items-center text-xs">
              <input
                type="radio"
                name="boxType"
                value="height"
                checked={boxType === "height"}
                onChange={(e) =>
                  setBoxType(e.target.value as "wall" | "furniture" | "height")
                }
                className="mr-1"
              />
              <span className="text-gray-800">Height Zone (xanh)</span>
            </label>
          </div>

          {/* Height value input for height zones */}
          {boxType === "height" && (
            <div className="mt-2">
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Độ cao:
              </label>
              <input
                type="number"
                value={heightValue}
                onChange={(e) =>
                  setHeightValue(parseFloat(e.target.value) || 0)
                }
                step="0.1"
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-gray-900 font-medium"
                placeholder="0.5"
              />
              <p className="text-xs text-gray-600 mt-1">
                +0.5 = nâng lên, -0.3 = hạ xuống (từ ground level)
              </p>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateBox}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors font-medium"
        >
          📦 Tạo Collision Box tại vị trí này
        </button>

        <div className="text-xs text-gray-800 bg-gray-100 p-2 rounded border border-gray-300">
          <strong className="text-gray-900">Hướng dẫn:</strong>
          <br />
          1. Di chuyển nhân vật đến vật thể cần collision
          <br />
          2. Chọn preset hoặc điều chỉnh kích thước
          <br />
          3. Click &quot;Tạo Collision Box&quot;
          <br />
          4. Code sẽ được copy vào clipboard
          <br />
          5. Paste vào CollisionSystem.tsx
        </div>
      </div>
    </div>
  );
}

// Export cả hai components
export { PreviewCollisionBox as PreviewBox };
