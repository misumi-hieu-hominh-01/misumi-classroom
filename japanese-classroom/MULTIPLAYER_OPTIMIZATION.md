# Multiplayer Performance Optimization

## Vấn đề đã giải quyết

### Vấn đề ban đầu
Khi nhiều người chơi cùng tham gia, các model 3D bị conflict:
- Player 1 di chuyển → Player 2 biến mất
- Animations bị chia sẻ giữa các players
- Scene instances bị conflict

### Nguyên nhân
- Tất cả players đang dùng chung một instance của GLB model
- Animations được chia sẻ, không có instance riêng
- Scene references bị override lẫn nhau

## Giải pháp đã triển khai

### 1. Scene Cloning (Quan trọng nhất)
```typescript
const clonedScenes = useMemo(() => {
  return {
    idle: idleModelSource.scene.clone(true),
    walking: walkingModelSource.scene.clone(true),
    running: runningModelSource.scene.clone(true)
  }
}, [idleModelSource.scene, walkingModelSource.scene, runningModelSource.scene])
```

**Tại sao quan trọng:**
- Mỗi player có instance scene riêng
- Không bị conflict về rendering
- Clone với `true` để clone toàn bộ hierarchy

### 2. Animation Cloning
```typescript
const processedWalkingAnimations = useMemo(() => {
  if (!walkingModelSource.animations.length) return []
  
  return walkingModelSource.animations.map((clip) => {
    const clonedClip = clip.clone()
    removeRootMotion(clonedClip, 'mixamorigHips')
    return clonedClip
  })
}, [walkingModelSource.animations])
```

**Lợi ích:**
- Mỗi player có animations riêng
- Animations không bị conflict
- Remove root motion cho từng clone

### 3. Memory Management
```typescript
useEffect(() => {
  return () => {
    // Dispose cloned scenes để free memory
    clonedScenes.idle.traverse((child) => {
      if ('geometry' in child && child.geometry) 
        (child.geometry as THREE.BufferGeometry).dispose()
      if ('material' in child && child.material) {
        const material = child.material as THREE.Material | THREE.Material[]
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose())
        } else {
          material.dispose()
        }
      }
    })
    // ... similar for walking and running
  }
}, [clonedScenes])
```

**Quan trọng:**
- Cleanup khi component unmount
- Tránh memory leak
- Dispose geometries và materials

### 4. React Optimization
```typescript
export const OtherPlayer = memo(OtherPlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.position.x === nextProps.player.position.x &&
    prevProps.player.position.y === nextProps.player.position.y &&
    prevProps.player.position.z === nextProps.player.position.z &&
    prevProps.player.rotation.y === nextProps.player.rotation.y &&
    prevProps.player.isMoving === nextProps.player.isMoving &&
    prevProps.player.username === nextProps.player.username
  )
})
```

**Lợi ích:**
- Chỉ re-render khi dữ liệu thực sự thay đổi
- Custom comparison cho performance
- Giảm số lần render không cần thiết

### 5. Model Preloading
```typescript
useGLTF.preload('/animation/idle.glb')
useGLTF.preload('/animation/walking.glb')
useGLTF.preload('/animation/running.glb')
```

**Lợi ích:**
- Models được load trước
- Giảm loading time khi player join
- Smooth experience

## Performance với nhiều players

### Khả năng scale
- **Hiện tại:** Đã test với 2-3 players, hoạt động mượt
- **Mục tiêu:** 10 players cùng lúc
- **Bottleneck tiềm năng:** 
  - Animation updates (mỗi player có 3 animations)
  - Position interpolation
  - Rendering

### Optimization tips cho 10+ players

1. **LOD (Level of Detail):**
   ```typescript
   // Có thể implement sau nếu cần
   // Giảm quality cho players xa camera
   ```

2. **Culling:**
   ```typescript
   // Không render players ngoài viewport
   // Có thể dùng <Frustum> từ drei
   ```

3. **Update throttling:**
   ```typescript
   // Giảm tần suất update position cho players xa
   // Ví dụ: 60fps cho players gần, 20fps cho players xa
   ```

4. **Instanced rendering:** (Advanced)
   - Dùng InstancedMesh cho static parts
   - Phức tạp với animated models

## Monitoring Performance

### Metrics cần theo dõi:
- FPS (Frame Per Second)
- Memory usage
- Network bandwidth (position updates)
- Render time per frame

### Chrome DevTools:
```
Performance tab → Record → Test với nhiều players
- Xem frame time
- Identify bottlenecks
```

### React DevTools Profiler:
```
- Check re-render count
- Identify unnecessary renders
```

## Troubleshooting

### Vấn đề: Players vẫn bị conflict
**Giải pháp:** Kiểm tra xem có đang dùng cloned scenes không

### Vấn đề: Memory leak
**Giải pháp:** Đảm bảo dispose được gọi trong cleanup

### Vấn đề: FPS drop với nhiều players
**Giải pháp:** 
1. Giảm tần suất position update
2. Implement LOD
3. Optimize animations

## Best Practices

1. **Always clone scenes** khi có nhiều instances
2. **Always dispose** trong cleanup
3. **Use memo** cho components có nhiều instances
4. **Preload assets** để giảm loading time
5. **Monitor performance** khi scale up

## Future Improvements

1. **Spatial partitioning:** Chỉ update players trong range
2. **Animation pooling:** Reuse animations khi có thể
3. **Progressive loading:** Load models theo priority
4. **WebWorkers:** Offload heavy computations
5. **Occlusion culling:** Không render players bị che khuất

