import { useRef, useEffect } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { Group } from "three";

interface TeacherProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

export default function Teacher({
  position = [0, -1.2, -22],
  scale = 0.9,
  rotation = [0, 0, 0],
}: TeacherProps) {
  const group = useRef<Group>(null);

  // Load teacher model
  const gltf = useGLTF("/animation/talk.glb");
  const { actions, names } = useAnimations(gltf.animations, group);

  // Ensure model visibility
  useEffect(() => {
    // Force all children visible
    gltf.scene.traverse((child) => {
      child.visible = true;
    });
  }, [gltf]);

  // Auto-play talk animation when component mounts
  useEffect(() => {
    if (names.length > 0) {
      const talkAction = actions[names[0]];
      if (talkAction) {
        talkAction.reset().play();
        // Loop the animation
        talkAction.setLoop(2201, Infinity); // LoopRepeat = 2201
      }
    }
  }, [actions, names]);

  return (
    <group ref={group} position={position} scale={scale} rotation={rotation}>
      {/* Teacher model - lớn hơn học sinh và đúng height */}
      <group position={[0, 1.3, 0]}>
        <primitive object={gltf.scene} scale={1.2} />
      </group>
    </group>
  );
}

// Preload teacher model
useGLTF.preload("/animation/talk.glb");
