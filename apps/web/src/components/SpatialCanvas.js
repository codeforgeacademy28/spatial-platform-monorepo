import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { createSpatialComment } from '@spatial/collaboration';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
import { SpatialCommentPin } from './SpatialCommentPin.js';
function FloorGrid({ onSelectPoint }) {
    return (_jsxs(_Fragment, { children: [_jsx("gridHelper", { args: [30, 30, '#38bdf8', '#334155'] }), _jsxs("mesh", { "rotation-x": -Math.PI / 2, position: [0, -0.01, 0], receiveShadow: true, onClick: (e) => onSelectPoint?.(e), children: [_jsx("planeGeometry", { args: [30, 30] }), _jsx("meshStandardMaterial", { color: "#0f172a" })] })] }));
}
function WallMesh({ wall, onSelectPoint }) {
    const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
    const start = extrusion.bottomCorners[0];
    const end = extrusion.bottomCorners[1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 0.001;
    const angle = Math.atan2(dy, dx);
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    return (_jsxs("mesh", { position: [centerX, wall.height / 2, centerY], rotation: [0, -angle, 0], castShadow: true, receiveShadow: true, onClick: (e) => onSelectPoint?.(e), children: [_jsx("boxGeometry", { args: [length, wall.height, wall.thickness] }), _jsx("meshStandardMaterial", { color: "#cbd5e1", metalness: 0.12, roughness: 0.7 })] }));
}
function RoomFloor({ room, onSelectPoint }) {
    const geometry = useMemo(() => {
        const floorMesh = generateRoomFloorMesh(room);
        const bufferGeometry = new THREE.BufferGeometry();
        if (floorMesh.vertices.length > 0) {
            bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(floorMesh.vertices, 3));
            bufferGeometry.setIndex(floorMesh.indices);
            bufferGeometry.computeVertexNormals();
        }
        return bufferGeometry;
    }, [room]);
    return (_jsx("mesh", { geometry: geometry, position: [0, 0.01, 0], receiveShadow: true, onClick: (e) => onSelectPoint?.(e), children: _jsx("meshStandardMaterial", { color: "#1d4ed8", transparent: true, opacity: 0.35 }) }));
}
export function SpatialCanvas({ projectId = 'project-1', walls, rooms, points, readOnly = false, onCommentAdd, }) {
    const [comments, setComments] = useState([]);
    const handlePointClick = (e) => {
        e.stopPropagation();
        const hitPoint = e.point;
        const hitNormal = e.face?.normal ?? new THREE.Vector3(0, 1, 0);
        const commentText = window.prompt('Add a 3D spatial comment at this position:');
        if (!commentText || !commentText.trim()) {
            return;
        }
        const comment = createSpatialComment({
            projectId,
            author: 'Reviewer',
            text: commentText.trim(),
            position: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z },
            normal: { x: hitNormal.x, y: hitNormal.y, z: hitNormal.z },
        });
        setComments((prev) => [...prev, comment]);
        if (onCommentAdd) {
            onCommentAdd(comment);
        }
    };
    return (_jsx("div", { className: "h-screen w-screen bg-slate-950", children: _jsxs(Canvas, { camera: { position: [10, 8, 12], fov: 50 }, shadows: true, children: [_jsx("color", { attach: "background", args: ['#020617'] }), _jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [10, 12, 8], intensity: 1.2, castShadow: true }), _jsx(FloorGrid, { onSelectPoint: handlePointClick }), rooms.map((room) => (_jsx(RoomFloor, { room: room, onSelectPoint: handlePointClick }, room.id))), walls.map((wall) => (_jsx(WallMesh, { wall: wall, onSelectPoint: handlePointClick }, wall.id))), points.map((point, index) => (_jsxs("mesh", { position: [point.x, 0.1, point.y], children: [_jsx("sphereGeometry", { args: [0.12, 16, 16] }), _jsx("meshStandardMaterial", { color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0.4 })] }, `${point.x}-${point.y}-${index}`))), comments.map((comment) => (_jsx(SpatialCommentPin, { comment: comment }, comment.id))), _jsx(OrbitControls, { enablePan: readOnly ? false : true, enableZoom: true, enableRotate: true }), !readOnly ? _jsx(PointerLockControls, {}) : null] }) }));
}
//# sourceMappingURL=SpatialCanvas.js.map