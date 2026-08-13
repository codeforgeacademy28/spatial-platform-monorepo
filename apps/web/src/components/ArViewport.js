import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands } from '@react-three/xr';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { extrudeWallSegments, generateRoomFloorMesh } from '@spatial/geometry-engine';
function FloorGrid() {
    return (_jsxs("mesh", { "rotation-x": -Math.PI / 2, position: [0, -0.01, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [25, 25] }), _jsx("meshStandardMaterial", { color: "#0f172a" })] }));
}
function WallMesh({ wall }) {
    const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
    const start = extrusion.bottomCorners[0];
    const end = extrusion.bottomCorners[1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 0.001;
    const angle = Math.atan2(dy, dx);
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    return (_jsxs("mesh", { position: [centerX, wall.height / 2, centerY], rotation: [0, -angle, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [length, wall.height, wall.thickness] }), _jsx("meshStandardMaterial", { color: "#38bdf8", metalness: 0.25, roughness: 0.4 })] }));
}
function RoomFloor({ room }) {
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
    return (_jsx("mesh", { geometry: geometry, position: [0, 0.01, 0], receiveShadow: true, children: _jsx("meshStandardMaterial", { color: "#2563eb", transparent: true, opacity: 0.35 }) }));
}
export function ArViewport({ walls, rooms }) {
    return (_jsx("div", { className: "h-screen w-screen bg-black", children: _jsxs(Canvas, { children: [_jsx("color", { attach: "background", args: ['#000000'] }), _jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [2, 10, 2], intensity: 1.2, castShadow: true }), _jsxs(XR, { children: [_jsx(Controllers, {}), _jsx(Hands, {}), _jsx(FloorGrid, {}), rooms.map((room) => (_jsx(RoomFloor, { room: room }, room.id))), walls.map((wall) => (_jsx(WallMesh, { wall: wall }, wall.id)))] }), _jsx(OrbitControls, {})] }) }));
}
//# sourceMappingURL=ArViewport.js.map