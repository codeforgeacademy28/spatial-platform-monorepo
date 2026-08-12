import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import { diffProjects } from '@spatial/collaboration';
import { extrudeWallSegments } from '@spatial/geometry-engine';
function getChangeColor(changeType) {
    switch (changeType) {
        case 'added':
            return '#22c55e'; // Green
        case 'removed':
            return '#ef4444'; // Red
        case 'shifted':
            return '#eab308'; // Yellow
        case 'unchanged':
        default:
            return '#cbd5e1'; // Slate
    }
}
function DiffWallMesh({ item }) {
    const wall = item.wall;
    const color = getChangeColor(item.changeType);
    const extrusion = useMemo(() => extrudeWallSegments([wall])[0], [wall]);
    const start = extrusion.bottomCorners[0];
    const end = extrusion.bottomCorners[1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 0.001;
    const angle = Math.atan2(dy, dx);
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    return (_jsxs("mesh", { position: [centerX, wall.height / 2, centerY], rotation: [0, -angle, 0], castShadow: true, receiveShadow: true, children: [_jsx("boxGeometry", { args: [length, wall.height, wall.thickness] }), _jsx("meshStandardMaterial", { color: color, emissive: color, emissiveIntensity: item.changeType !== 'unchanged' ? 0.35 : 0, metalness: 0.12, roughness: 0.7 })] }));
}
function DiffCanvas({ walls, label }) {
    return (_jsxs("div", { className: "relative h-full w-full border-r border-slate-800 bg-slate-950", children: [_jsx("div", { className: "absolute left-3 top-3 z-10 rounded border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur", children: label }), _jsxs(Canvas, { camera: { position: [10, 8, 12], fov: 50 }, shadows: true, children: [_jsx("color", { attach: "background", args: ['#020617'] }), _jsx("ambientLight", { intensity: 0.8 }), _jsx("directionalLight", { position: [10, 12, 8], intensity: 1.2, castShadow: true }), _jsx("gridHelper", { args: [30, 30, '#38bdf8', '#334155'] }), _jsxs("mesh", { "rotation-x": -Math.PI / 2, position: [0, -0.01, 0], receiveShadow: true, children: [_jsx("planeGeometry", { args: [30, 30] }), _jsx("meshStandardMaterial", { color: "#0f172a" })] }), walls.map((item, index) => (_jsx(DiffWallMesh, { item: item }, `${item.wall.id}-${index}`))), _jsx(OrbitControls, { enablePan: true, enableZoom: true, enableRotate: true })] })] }));
}
export function VersionComparer({ versionA, versionB, onClose }) {
    const diff = useMemo(() => diffProjects(versionA, versionB), [versionA, versionB]);
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100", children: [_jsxs("header", { className: "flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h2", { className: "text-base font-semibold text-white", children: "Side-by-Side Version Comparison" }), _jsxs("div", { className: "flex items-center gap-3 text-xs", children: [_jsxs("span", { className: "flex items-center gap-1 text-emerald-400", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-emerald-500" }), diff.stats.addedCount, " Added"] }), _jsxs("span", { className: "flex items-center gap-1 text-rose-400", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-rose-500" }), diff.stats.removedCount, " Removed"] }), _jsxs("span", { className: "flex items-center gap-1 text-amber-400", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-amber-500" }), diff.stats.shiftedCount, " Shifted"] }), _jsxs("span", { className: "flex items-center gap-1 text-slate-400", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-slate-400" }), diff.stats.unchangedCount, " Unchanged"] })] })] }), onClose ? (_jsx("button", { type: "button", onClick: onClose, className: "rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700", children: "Close Comparison" })) : null] }), _jsxs("div", { className: "grid flex-1 grid-cols-2", children: [_jsx(DiffCanvas, { walls: diff.wallsA, label: `Version A (${versionA.name})` }), _jsx(DiffCanvas, { walls: diff.wallsB, label: `Version B (${versionB.name})` })] })] }));
}
//# sourceMappingURL=VersionComparer.js.map