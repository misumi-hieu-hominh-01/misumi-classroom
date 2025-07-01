"use client";

import { Vector3, Group } from "three";
import { RefObject } from "react";

// Interface cho dynamic collision object (character, NPCs, etc.)
export interface DynamicCollisionObject {
  id: string;
  position: Vector3;
  radius: number;
  type: "player" | "cat" | "npc";
  groupRef?: RefObject<Group>; // Ref để debug visualization
}

// Global registry cho dynamic collision objects
const dynamicObjects = new Map<string, DynamicCollisionObject>();

// Register một object vào dynamic collision system
export function registerDynamicObject(object: DynamicCollisionObject) {
  dynamicObjects.set(object.id, object);
}

// Unregister một object khỏi dynamic collision system
export function unregisterDynamicObject(id: string) {
  dynamicObjects.delete(id);
}

// Update position của một object
export function updateDynamicObjectPosition(id: string, position: Vector3) {
  const object = dynamicObjects.get(id);
  if (object) {
    object.position.copy(position);
  }
}

// Kiểm tra collision với dynamic objects (tránh collision với chính nó)
export function checkDynamicCollision(
  position: Vector3,
  radius: number,
  excludeId?: string
): boolean {
  for (const [id, object] of dynamicObjects) {
    // Bỏ qua chính object đó
    if (excludeId && id === excludeId) continue;

    // Tính khoảng cách giữa 2 objects
    const distance = position.distanceTo(object.position);
    const combinedRadius = radius + object.radius;

    // Kiểm tra collision
    if (distance < combinedRadius) {
      return true;
    }
  }

  return false;
}

// Tìm valid position tránh dynamic collision
export function findValidPositionAvoidingDynamic(
  targetPosition: Vector3,
  currentPosition: Vector3,
  radius: number,
  excludeId?: string
): Vector3 {
  // Nếu target position không có collision, sử dụng nó
  if (!checkDynamicCollision(targetPosition, radius, excludeId)) {
    return targetPosition.clone();
  }

  // Tính hướng di chuyển
  const moveDirection = new Vector3()
    .subVectors(targetPosition, currentPosition)
    .normalize();

  // Thử sliding theo các axis
  const slidePositions = [
    // Slide theo X axis
    new Vector3(targetPosition.x, currentPosition.y, currentPosition.z),
    // Slide theo Z axis
    new Vector3(currentPosition.x, currentPosition.y, targetPosition.z),
  ];

  for (const slidePos of slidePositions) {
    if (!checkDynamicCollision(slidePos, radius, excludeId)) {
      return slidePos;
    }
  }

  // Thử step nhỏ theo hướng di chuyển
  const stepSize = 0.05;
  const maxSteps = 10;

  for (let step = 1; step <= maxSteps; step++) {
    const testPosition = currentPosition
      .clone()
      .add(moveDirection.clone().multiplyScalar(stepSize * step));

    if (!checkDynamicCollision(testPosition, radius, excludeId)) {
      return testPosition;
    }
  }

  // Thử các hướng vuông góc
  const perpendicular = [
    new Vector3(-moveDirection.z, 0, moveDirection.x).normalize(),
    new Vector3(moveDirection.z, 0, -moveDirection.x).normalize(),
  ];

  for (const direction of perpendicular) {
    for (let step = 1; step <= 5; step++) {
      const testPosition = currentPosition
        .clone()
        .add(direction.clone().multiplyScalar(stepSize * step));

      if (!checkDynamicCollision(testPosition, radius, excludeId)) {
        return testPosition;
      }
    }
  }

  // Nếu không tìm được, ở lại vị trí hiện tại
  return currentPosition.clone();
}

// Tìm hướng tránh collision cho AI (như cat)
export function getAvoidanceDirection(
  currentPosition: Vector3,
  currentDirection: number,
  radius: number,
  excludeId?: string
): number {
  // Tính vị trí target dựa trên hướng hiện tại
  const step = 0.5;
  const targetPosition = currentPosition.clone();
  targetPosition.x += Math.sin(currentDirection) * step;
  targetPosition.z += Math.cos(currentDirection) * step;

  // Nếu không có collision, giữ nguyên hướng
  if (!checkDynamicCollision(targetPosition, radius, excludeId)) {
    return currentDirection;
  }

  // Thử các hướng khác nhau để tránh collision
  const avoidanceTurns = [
    Math.PI / 4, // 45 độ phải
    -Math.PI / 4, // 45 độ trái
    Math.PI / 2, // 90 độ phải
    -Math.PI / 2, // 90 độ trái
    Math.PI, // 180 độ (quay ngược)
  ];

  for (const turn of avoidanceTurns) {
    const newDirection = currentDirection + turn;
    const testPosition = currentPosition.clone();
    testPosition.x += Math.sin(newDirection) * step;
    testPosition.z += Math.cos(newDirection) * step;

    if (!checkDynamicCollision(testPosition, radius, excludeId)) {
      return newDirection;
    }
  }

  // Nếu tất cả hướng đều bị block, quay ngược lại
  return currentDirection + Math.PI;
}

// Get all dynamic objects (để debug)
export function getAllDynamicObjects(): Map<string, DynamicCollisionObject> {
  return dynamicObjects;
}

// Render debug visualization cho dynamic objects
export function renderDynamicCollisionBoxes() {
  // Đã tắt hiển thị các khối cầu collision debug
  return null;
}
