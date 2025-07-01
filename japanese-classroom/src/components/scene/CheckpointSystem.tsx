import { Vector3, Box3 } from "three";

// Định nghĩa checkpoint - điểm kích hoạt sự kiện
export interface Checkpoint {
  min: Vector3;
  max: Vector3;
  name: string;
  id: string;
  type: "seat" | "desk" | "board" | "door" | "teacher" | "custom";
  message: string; // Thông báo hiển thị khi kích hoạt
  triggered?: boolean; // Đã kích hoạt chưa
  cooldown?: number; // Thời gian nghỉ giữa các lần kích hoạt (ms)
  lastTriggered?: number; // Thời gian lần cuối kích hoạt
}

// Danh sách các checkpoint trong phòng học
// Có thể sử dụng CheckpointHelper để tạo thêm Ghế học sinh
export const CLASSROOM_CHECKPOINTS: Checkpoint[] = [
  // Checkpoint tại vị trí ghế (ví dụ)
  {
    min: new Vector3(-7.0, -2.2, -3.2),
    max: new Vector3(-6.0, -0.2, -2.2),
    name: "Ghế học sinh",
    id: "seat_1751121319287",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-12.2, -2.2, -3.3),
    max: new Vector3(-11.2, -0.2, -2.3),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-17.6, -2.7, -3.1),
    max: new Vector3(-16.1, 0.3, -2.6),
    name: "Ghế học sinh",
    id: "seat_1751122470972",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 2000,
  },
  {
    min: new Vector3(-22.1, -2.2, -3.3),
    max: new Vector3(-21.1, -0.2, -2.3),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-26.9, -2.2, -3.3),
    max: new Vector3(-25.9, -0.2, -2.3),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-7.1, -2.2, -8.2),
    max: new Vector3(-6.1, -0.2, -7.2),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-12.4, -2.7, -7.8),
    max: new Vector3(-10.9, 0.3, -7.3),
    name: "Ghế học sinh",
    id: "seat_1751122470972",
    type: "seat",
    message: "🚪 Bạn đã đến cửa ra vào! Hãy cẩn thận khi di chuyển.",
    cooldown: 2000,
  },
  {
    min: new Vector3(-17.3, -2.2, -8.1),
    max: new Vector3(-16.3, -0.2, -7.1),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-22.3, -2.2, -8.2),
    max: new Vector3(-21.3, -0.2, -7.2),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-27.0, -2.2, -8.1),
    max: new Vector3(-26.0, -0.2, -7.1),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-7.1, -2.2, -13.0),
    max: new Vector3(-6.1, -0.2, -12.0),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-12.2, -2.2, -13.0),
    max: new Vector3(-11.2, -0.2, -12.0),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-17.2, -2.2, -12.9),
    max: new Vector3(-16.2, -0.2, -11.9),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-22.1, -2.2, -12.9),
    max: new Vector3(-21.1, -0.2, -11.9),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-27.0, -2.2, -13.0),
    max: new Vector3(-26.0, -0.2, -12.0),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-7.2, -2.2, -17.6),
    max: new Vector3(-6.2, -0.2, -16.6),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-12.2, -2.2, -17.6),
    max: new Vector3(-11.2, -0.2, -16.6),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-17.2, -2.2, -17.7),
    max: new Vector3(-16.2, -0.2, -16.7),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-22.2, -2.2, -17.5),
    max: new Vector3(-21.2, -0.2, -16.5),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-26.9, -2.2, -17.6),
    max: new Vector3(-25.9, -0.2, -16.6),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-7.1, -2.2, -22.4),
    max: new Vector3(-6.1, -0.2, -21.4),
    name: "Ghế học sinh",
    id: "seat_1751121495262",
    type: "seat",
    message: "🪑 Bạn đã đến ghế học sinh! Hãy ngồi xuống để học bài.",
    cooldown: 3000,
  },
  {
    min: new Vector3(-12.0, -2.2, -22.3),
    max: new Vector3(-11.0, -0.2, -21.3),
    name: "Ghế học sinh",
    id: "checkpoint_01",
    type: "seat",
    message: "Bạn đã đến một vị trí đặc biệt!",
    cooldown: 3000,
  },
  {
    min: new Vector3(-17.2, -2.2, -22.3),
    max: new Vector3(-16.2, -0.2, -21.3),
    name: "Ghế học sinh",
    id: "checkpoint_01",
    type: "seat",
    message: "Bạn đã đến một vị trí đặc biệt!",
    cooldown: 3000,
  },
  {
    min: new Vector3(-22.2, -2.2, -22.4),
    max: new Vector3(-21.2, -0.2, -21.4),
    name: "Ghế học sinh",
    id: "checkpoint_01",
    type: "seat",
    message: "Bạn đã đến một vị trí đặc biệt!",
    cooldown: 3000,
  },
  {
    min: new Vector3(-26.9, -2.2, -22.3),
    max: new Vector3(-25.9, -0.2, -21.3),
    name: "Ghế học sinh",
    id: "checkpoint_01",
    type: "seat",
    message: "Bạn đã đến một vị trí đặc biệt!",
    cooldown: 3000,
  },
  // Teacher checkpoint - expanded area around teacher
  {
    min: new Vector3(-2.5, -1.7, -23.2),
    max: new Vector3(6.3, 0.3, -14.0),

    name: "Giáo viên",
    id: "teacher_01",
    type: "teacher",
    message: "🧑‍🏫 Hãy nói chuyện với giáo viên!",
    cooldown: 2000,
  },
  // Có thể thêm nhiều checkpoint khác bằng CheckpointHelper
];

// Kiểm tra xem nhân vật có đang ở gần checkpoint nào không (không quan tâm cooldown)
export function findNearbyCheckpoint(
  position: Vector3,
  characterRadius: number = 0.5
): Checkpoint | null {
  // Tạo bounding box cho nhân vật
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

  // Kiểm tra collision với từng checkpoint
  for (const checkpoint of CLASSROOM_CHECKPOINTS) {
    const checkpointBox = new Box3(checkpoint.min, checkpoint.max);

    if (characterBox.intersectsBox(checkpointBox)) {
      return checkpoint;
    }
  }

  return null;
}

// Kiểm tra xem nhân vật có đang ở trong checkpoint nào không (có kiểm tra cooldown)
export function checkCheckpoints(
  position: Vector3,
  characterRadius: number = 0.5
): Checkpoint | null {
  const nearbyCheckpoint = findNearbyCheckpoint(position, characterRadius);

  if (!nearbyCheckpoint) return null;

  // Kiểm tra cooldown
  const now = Date.now();
  if (nearbyCheckpoint.lastTriggered && nearbyCheckpoint.cooldown) {
    if (now - nearbyCheckpoint.lastTriggered < nearbyCheckpoint.cooldown) {
      return null; // Còn trong thời gian cooldown
    }
  }

  return nearbyCheckpoint;
}

// Kích hoạt checkpoint
export function triggerCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.triggered = true;
  checkpoint.lastTriggered = Date.now();
}

// Reset trạng thái của tất cả checkpoint
export function resetAllCheckpoints(): void {
  CLASSROOM_CHECKPOINTS.forEach((checkpoint) => {
    checkpoint.triggered = false;
    checkpoint.lastTriggered = undefined;
  });
}

// Thêm Ghế học sinh vào danh sách
export function addCheckpoint(checkpoint: Checkpoint): void {
  CLASSROOM_CHECKPOINTS.push(checkpoint);
}

// Render visual checkpoint boxes (để debug)
export function renderCheckpointBoxes() {
  return CLASSROOM_CHECKPOINTS.map((checkpoint, index) => (
    <mesh
      key={`checkpoint-${checkpoint.id}-${index}`}
      position={[
        (checkpoint.min.x + checkpoint.max.x) / 2,
        (checkpoint.min.y + checkpoint.max.y) / 2,
        (checkpoint.min.z + checkpoint.max.z) / 2,
      ]}
    >
      <boxGeometry
        args={[
          checkpoint.max.x - checkpoint.min.x,
          checkpoint.max.y - checkpoint.min.y,
          checkpoint.max.z - checkpoint.min.z,
        ]}
      />
      <meshBasicMaterial
        color={
          checkpoint.type === "seat"
            ? "green"
            : checkpoint.type === "board"
            ? "blue"
            : checkpoint.type === "desk"
            ? "yellow"
            : "purple"
        }
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  ));
}
