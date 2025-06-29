import { Vector3, Box3 } from "three";

// Định nghĩa các collision box cho classroom
// Tọa độ dựa trên scale 3x của classroom model
export interface CollisionBox {
  min: Vector3;
  max: Vector3;
  name: string;
  type?: "wall" | "furniture" | "height"; // Loại collision
  height?: number; // Độ cao mới cho height zones
}

// Height zones - các vùng có độ cao khác nhau
export const HEIGHT_ZONES: CollisionBox[] = [
  // Ví dụ: Bục giảng - nâng lên 0.5 units từ ground level
  {
    min: new Vector3(-0.2, -2.0, -20.4),
    max: new Vector3(4.5, -0.3, -4.7),
    name: "bục giảng",
    type: "height",
    height: 0.5, // Nâng lên 0.5 units từ ground level
  },
  // Có thể thêm nhiều height zones khác
];

// Collision boundaries cho classroom (scale 3x)
// COMMENT OUT TẤT CẢ ĐỂ SỬ DỤNG COLLISION HELPER TẠO LẠI
export const CLASSROOM_COLLISIONS: CollisionBox[] = [
  // Temporarily empty - use Collision Helper to generate accurate positions
  {
    min: new Vector3(-6.0, -2.2, -3.8),
    max: new Vector3(-4.0, -0.2, -1.8),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.0, -2.2, -8.7),
    max: new Vector3(-4.0, -0.2, -6.7),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.1, -2.2, -13.4),
    max: new Vector3(-4.1, -0.2, -11.4),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.1, -2.2, -18.2),
    max: new Vector3(-4.1, -0.2, -16.2),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.1, -2.2, -18.1),
    max: new Vector3(-4.1, -0.2, -16.1),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.1, -2.2, -23.0),
    max: new Vector3(-4.1, -0.2, -21.0),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-6.1, -2.2, -18.1),
    max: new Vector3(-4.1, -0.2, -16.1),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-11.1, -2.2, -18.1),
    max: new Vector3(-9.1, -0.2, -16.1),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-11.1, -2.2, -13.4),
    max: new Vector3(-9.1, -0.2, -11.4),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-11.1, -2.2, -8.7),
    max: new Vector3(-9.1, -0.2, -6.7),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-11.1, -2.2, -3.8),
    max: new Vector3(-9.1, -0.2, -1.8),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-16.2, -2.2, -3.8),
    max: new Vector3(-14.2, -0.2, -1.8),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-16.2, -2.2, -8.7),
    max: new Vector3(-14.2, -0.2, -6.7),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-16.2, -2.2, -13.4),
    max: new Vector3(-14.2, -0.2, -11.4),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-16.2, -2.2, -18.2),
    max: new Vector3(-14.2, -0.2, -16.2),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-16.2, -2.2, -23.0),
    max: new Vector3(-14.2, -0.2, -21.0),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-21.1, -2.2, -3.9),
    max: new Vector3(-19.1, -0.2, -1.9),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-21.1, -2.2, -8.7),
    max: new Vector3(-19.1, -0.2, -6.7),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-21.1, -2.2, -13.4),
    max: new Vector3(-19.1, -0.2, -11.4),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-21.1, -2.2, -18.1),
    max: new Vector3(-19.1, -0.2, -16.1),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-21.1, -2.2, -23.0),
    max: new Vector3(-19.1, -0.2, -21.0),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-25.9, -2.2, -3.9),
    max: new Vector3(-23.9, -0.2, -1.9),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-25.9, -2.2, -8.7),
    max: new Vector3(-23.9, -0.2, -6.7),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-25.9, -2.2, -13.4),
    max: new Vector3(-23.9, -0.2, -11.4),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-11.0, -2.2, -22.8),
    max: new Vector3(-9.2, -0.2, -20.8),
    name: "bàn học sinh",
    type: "furniture",
  },
  {
    min: new Vector3(-25.9, -2.2, -18.1),
    max: new Vector3(-23.9, -0.2, -16.1),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-25.9, -2.2, -23.0),
    max: new Vector3(-23.9, -0.2, -21.0),
    name: "new-collision",
    type: "furniture",
  },
  {
    min: new Vector3(-31.8, -5.2, -22.3),
    max: new Vector3(-30.8, 2.8, -3.3),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-33.0, -5.2, -22.3),
    max: new Vector3(-32.0, 2.8, -7.3),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-34.0, -5.2, -24.7),
    max: new Vector3(-33.0, 2.8, -22.7),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-33.9, -5.2, -3.2),
    max: new Vector3(-32.9, 2.8, -0.2),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(0.2, -1.7, -19.5),
    max: new Vector3(2.2, 0.3, -17.0),
    name: "bàn giảng",
    type: "furniture",
  },
  {
    min: new Vector3(2.2, -2.7, -19.7),
    max: new Vector3(4.4, 1.3, -18.1),
    name: "giao vien",
    type: "wall",
  },
  {
    min: new Vector3(3.1, -2.2, -25.2),
    max: new Vector3(4.8, -0.2, -23.2),
    name: "bàn học sinh",
    type: "furniture",
  },
  {
    min: new Vector3(4.5, -5.2, -23.0),
    max: new Vector3(5.5, 2.8, -0.0),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-23.5, -5.2, 0.1),
    max: new Vector3(-5.0, 2.8, 1.1),
    name: "new-collision",
    type: "wall",
  },
  {
    min: new Vector3(-33.3, -2.2, -0.1),
    max: new Vector3(-31.3, -0.2, 1.1),
    name: "bàn học sinh",
    type: "furniture",
  },
  {
    min: new Vector3(-33.1, -5.2, -25.9),
    max: new Vector3(2.9, 2.8, -24.9),
    name: "new-collision",
    type: "wall",
  },
  {
    min: new Vector3(-31.6, -5.2, 0.0),
    max: new Vector3(-24.1, 2.8, 1.5),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-32.8, -2.1, -4.2),
    max: new Vector3(-32.0, -0.3, -3.4),
    name: "tường",
    type: "wall",
  },
  {
    min: new Vector3(-0.9, -3.7, 0.2),
    max: new Vector3(4.6, 1.3, 1.2),
    name: "bàn giảng",
    type: "furniture",
  },
];

// Hàm kiểm tra collision với walls và furniture
export function checkCollision(
  position: Vector3,
  characterRadius: number = 0.5
): boolean {
  const characterBox = new Box3(
    new Vector3(
      position.x - characterRadius,
      position.y - characterRadius,
      position.z - characterRadius
    ),
    new Vector3(
      position.x + characterRadius,
      position.y + characterRadius,
      position.z + characterRadius
    )
  );

  // Chỉ kiểm tra collision với walls và furniture
  return CLASSROOM_COLLISIONS.some((collision) => {
    if (collision.type === "height") return false; // Bỏ qua height zones

    const collisionBox = new Box3(collision.min, collision.max);
    return characterBox.intersectsBox(collisionBox);
  });
}

// Hàm tính toán độ cao dựa trên height zones
export function calculateHeight(
  position: Vector3,
  defaultHeight: number = -1.2
): number {
  // Kiểm tra xem position có trong height zone nào không
  for (const zone of HEIGHT_ZONES) {
    if (
      position.x >= zone.min.x &&
      position.x <= zone.max.x &&
      position.z >= zone.min.z &&
      position.z <= zone.max.z
    ) {
      // zone.height là offset từ defaultHeight, không phải absolute value
      return defaultHeight + (zone.height !== undefined ? zone.height : 0);
    }
  }

  return defaultHeight; // Default ground level
}

// Hàm tìm vị trí hợp lệ gần nhất với wall sliding
export function findNearestValidPosition(
  targetPosition: Vector3,
  currentPosition: Vector3,
  characterRadius: number = 0.5
): Vector3 {
  // Nếu vị trí target không có collision, sử dụng nó với height phù hợp
  if (!checkCollision(targetPosition, characterRadius)) {
    const newHeight = calculateHeight(targetPosition);
    return new Vector3(targetPosition.x, newHeight, targetPosition.z);
  }

  // Calculate movement direction
  const movementDirection = new Vector3()
    .subVectors(targetPosition, currentPosition)
    .normalize();

  // Try wall sliding - test individual axes first
  const slidePositions = [
    // Try sliding along X axis (keep Y and Z, slide X towards target)
    new Vector3(targetPosition.x, currentPosition.y, currentPosition.z),
    // Try sliding along Z axis (keep X and Y, slide Z towards target)
    new Vector3(currentPosition.x, currentPosition.y, targetPosition.z),
  ];

  for (const slidePos of slidePositions) {
    if (!checkCollision(slidePos, characterRadius)) {
      const newHeight = calculateHeight(slidePos);
      return new Vector3(slidePos.x, newHeight, slidePos.z);
    }
  }

  // If sliding doesn't work, try small steps in movement direction
  const stepSize = 0.05;
  const maxSteps = 5;

  for (let step = 1; step <= maxSteps; step++) {
    const testPosition = currentPosition
      .clone()
      .add(movementDirection.clone().multiplyScalar(stepSize * step));

    if (!checkCollision(testPosition, characterRadius)) {
      const newHeight = calculateHeight(testPosition);
      return new Vector3(testPosition.x, newHeight, testPosition.z);
    }
  }

  // As last resort, try perpendicular directions (for corner cases)
  const perpendicular = [
    new Vector3(-movementDirection.z, 0, movementDirection.x).normalize(),
    new Vector3(movementDirection.z, 0, -movementDirection.x).normalize(),
  ];

  for (const direction of perpendicular) {
    for (let step = 1; step <= 3; step++) {
      const testPosition = currentPosition
        .clone()
        .add(direction.clone().multiplyScalar(stepSize * step));

      if (!checkCollision(testPosition, characterRadius)) {
        const newHeight = calculateHeight(testPosition);
        return new Vector3(testPosition.x, newHeight, testPosition.z);
      }
    }
  }

  // If all else fails, stay at current position
  const newHeight = calculateHeight(currentPosition);
  return new Vector3(currentPosition.x, newHeight, currentPosition.z);
}

// Render collision boxes và height zones
export function renderCollisionBoxes() {
  return (
    <>
      {/* Render collision boxes */}
      {CLASSROOM_COLLISIONS.map((collision, index) => (
        <mesh
          key={`collision-${index}`}
          position={[
            (collision.min.x + collision.max.x) / 2,
            (collision.min.y + collision.max.y) / 2,
            (collision.min.z + collision.max.z) / 2,
          ]}
        >
          <boxGeometry
            args={[
              collision.max.x - collision.min.x,
              collision.max.y - collision.min.y,
              collision.max.z - collision.min.z,
            ]}
          />
          <meshBasicMaterial
            color={collision.type === "wall" ? "red" : "yellow"}
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}

      {/* Render height zones */}
      {HEIGHT_ZONES.map((zone, index) => (
        <mesh
          key={`height-${index}`}
          position={[
            (zone.min.x + zone.max.x) / 2,
            zone.height || 0,
            (zone.min.z + zone.max.z) / 2,
          ]}
        >
          <boxGeometry
            args={[
              zone.max.x - zone.min.x,
              0.1, // Thin box để hiển thị height level
              zone.max.z - zone.min.z,
            ]}
          />
          <meshBasicMaterial color="green" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}
