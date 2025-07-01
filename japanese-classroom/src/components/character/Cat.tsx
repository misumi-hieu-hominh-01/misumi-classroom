"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group, Vector3 } from "three";
import {
  checkCollision,
  findNearestValidPosition,
} from "../scene/CollisionSystem";
import {
  registerDynamicObject,
  unregisterDynamicObject,
  updateDynamicObjectPosition,
  checkDynamicCollision,
  getAvoidanceDirection,
} from "../scene/DynamicCollisionSystem";

interface CatProps {
  /** Vị trí khởi tạo, mặc định nằm trong vùng đi lại */
  position?: [number, number, number];
  scale?: number;
}

export default function Cat({ position = [0, 0, 15], scale = 1 }: CatProps) {
  // —————— Refs ——————
  const movingGroupRef = useRef<Group>(null); // nhóm container để di chuyển
  const modelRef = useRef<Group>(null); // nhóm chứa mesh để chạy animation

  // Load GLTF và animations
  const { scene, animations } = useGLTF("/3d_source/orange_cat.glb");
  const { actions } = useAnimations(animations, modelRef);

  // State di chuyển lưu trong ref để tránh re-render
  const currentPosition = useRef(new Vector3(...position));
  const currentDirection = useRef(Math.random() * Math.PI * 2);
  const isMoving = useRef(false);
  const waitTime = useRef(0);
  const stepsTaken = useRef(0);
  const stepsRemaining = useRef(0);

  // Collision properties
  const catId = "orange-cat";
  const catRadius = 0.8; // Collision radius cho mèo

  // Hàm random bước và thời gian đợi
  const getRandomSteps = () => Math.floor(Math.random() * 50) + 20;
  const getRandomTurn = () => (Math.random() - 0.5) * Math.PI * 0.8;
  const getRandomWaitTime = () => Math.random() * 3 + 1;

  // —————— 1) Khởi vị trí & ép start walking ——————
  useEffect(() => {
    if (!movingGroupRef.current) return;

    // Thiết lập vị trí ban đầu
    movingGroupRef.current.position.set(...position);
    currentPosition.current.set(...position);

    // Register cat vào dynamic collision system
    registerDynamicObject({
      id: catId,
      position: currentPosition.current,
      radius: catRadius,
      type: "cat",
    });

    // Ép con mèo bắt đầu bước luôn
    stepsRemaining.current = getRandomSteps();
    stepsTaken.current = 0;
    isMoving.current = true;

    // Cleanup khi component unmount
    return () => {
      unregisterDynamicObject(catId);
    };
  }, []);

  // —————— 2) Hiển thị tất cả mesh ——————
  useEffect(() => {
    scene.traverse((c) => (c.visible = true));
  }, [scene]);

  // —————— 3) Chạy animation loop ——————
  useEffect(() => {
    const names = Object.keys(actions);
    if (names.length) {
      actions[names[0]]!.reset().play().setLoop(2201, Infinity);
    }
  }, [actions]);

  // —————— 4) Logic di chuyển trong useFrame ——————
  useFrame((_, delta) => {
    if (!movingGroupRef.current) return;

    // Nếu đang đợi, giảm waitTime
    if (waitTime.current > 0) {
      waitTime.current -= delta;
      return;
    }

    // Nếu chưa start moving, random chance để bật
    if (!isMoving.current) {
      if (Math.random() < 0.02) {
        stepsRemaining.current = getRandomSteps();
        stepsTaken.current = 0;
        isMoving.current = true;
      }
      return;
    }

    // Nếu đã đi đủ bước, nghỉ và quay hướng mới
    if (stepsTaken.current >= stepsRemaining.current) {
      currentDirection.current += getRandomTurn();
      waitTime.current = getRandomWaitTime();
      isMoving.current = false;
      return;
    }

    // Kiểm tra collision trước khi di chuyển
    const speed = 1.5; // tốc độ
    const step = speed * delta; // khoảng cách từng frame
    const dir = currentDirection.current;
    const dx = Math.sin(dir) * step;
    const dz = Math.cos(dir) * step;

    // Tạo vị trí target
    const targetPosition = currentPosition.current.clone();
    targetPosition.x += dx;
    targetPosition.z += dz;

    // Biên cho phép đi lại (giữ trong scene)
    const maxX = 15,
      minX = -15;
    const maxZ = 30,
      minZ = 5;

    // Kiểm tra biên scene
    if (
      targetPosition.x > maxX ||
      targetPosition.x < minX ||
      targetPosition.z > maxZ ||
      targetPosition.z < minZ
    ) {
      // chạm rào → quay ngược 180°
      currentDirection.current += Math.PI;
      return;
    }

    // Kiểm tra collision với static objects (walls, furniture)
    const hasStaticCollision = checkCollision(targetPosition, catRadius);

    // Kiểm tra collision với dynamic objects (player, other cats)
    const hasDynamicCollision = checkDynamicCollision(
      targetPosition,
      catRadius,
      catId
    );

    // Nếu có collision, tìm hướng tránh
    if (hasStaticCollision || hasDynamicCollision) {
      if (hasStaticCollision) {
        // Collision với static object -> tìm vị trí hợp lệ gần nhất
        const validPosition = findNearestValidPosition(
          targetPosition,
          currentPosition.current,
          catRadius
        );

        // Nếu không tìm được vị trí hợp lệ, đổi hướng
        if (validPosition.equals(currentPosition.current)) {
          currentDirection.current = getAvoidanceDirection(
            currentPosition.current,
            currentDirection.current,
            catRadius,
            catId
          );
        } else {
          // Cập nhật vị trí và tiếp tục
          stepsTaken.current += step;
          currentPosition.current.copy(validPosition);
          movingGroupRef.current.position.copy(validPosition);
          movingGroupRef.current.rotation.y = dir;

          // Cập nhật trong dynamic collision system
          updateDynamicObjectPosition(catId, currentPosition.current);
        }
      } else if (hasDynamicCollision) {
        // Collision với dynamic object -> tìm hướng tránh
        currentDirection.current = getAvoidanceDirection(
          currentPosition.current,
          currentDirection.current,
          catRadius,
          catId
        );
      }
      return;
    }

    // Không có collision, di chuyển bình thường
    stepsTaken.current += step;
    currentPosition.current.copy(targetPosition);
    movingGroupRef.current.position.copy(targetPosition);
    movingGroupRef.current.rotation.y = dir;

    // Cập nhật trong dynamic collision system
    updateDynamicObjectPosition(catId, currentPosition.current);
  });

  return (
    <group ref={movingGroupRef} scale={scale}>
      {/* Chỗ modelRef chịu ảnh hưởng của animations */}
      <primitive ref={modelRef} object={scene} />
    </group>
  );
}

// preload để tối ưu
useGLTF.preload("/3d_source/orange_cat.glb");
