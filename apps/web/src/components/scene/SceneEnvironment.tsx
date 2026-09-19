import { useMemo } from 'react';
import type { Room, WallSegment } from '@spatial/core';
import { generateRoomFloorMesh } from '@spatial/geometry-engine';
import * as THREE from 'three';

export function SceneFloor({rooms}:{rooms:Room[]}):JSX.Element{
 return <><mesh rotation-x={-Math.PI/2} position={[0,-.012,0]} receiveShadow><planeGeometry args={[40,40]}/><meshStandardMaterial color="#17120f" roughness={.52}/></mesh>{rooms.map(room=><RoomFloor key={room.id} room={room}/>)}</>;
}
function RoomFloor({room}:{room:Room}):JSX.Element{
 const geometry=useMemo(()=>{const f=generateRoomFloorMesh(room);const g=new THREE.BufferGeometry();if(f.vertices.length){g.setAttribute('position',new THREE.Float32BufferAttribute(f.vertices,3));g.setIndex(f.indices);g.computeVertexNormals();}return g;},[room]);
 return <mesh geometry={geometry} position={[0,.005,0]} receiveShadow><meshStandardMaterial color="#6d5a4d" transparent opacity={.38} roughness={.4}/></mesh>;
}
export function SceneCeiling({walls,enabled}:{walls:WallSegment[];enabled:boolean}):JSX.Element|null{
 if(!enabled||!walls.length)return null;
 const xs=walls.flatMap(w=>[w.start.x,w.end.x]),zs=walls.flatMap(w=>[w.start.y,w.end.y]),minX=Math.min(...xs)-.8,maxX=Math.max(...xs)+.8,minZ=Math.min(...zs)-.8,maxZ=Math.max(...zs)+.8,y=Math.max(...walls.map(w=>w.height));
 return <mesh position={[(minX+maxX)/2,y,(minZ+maxZ)/2]} rotation={[Math.PI/2,0,0]} receiveShadow><planeGeometry args={[maxX-minX,maxZ-minZ]}/><meshStandardMaterial color="#f5eee5" roughness={.86} side={THREE.DoubleSide}/></mesh>;
}
export function GalleryLighting({warm=true}:{warm?:boolean}):JSX.Element{
 return <><ambientLight intensity={warm?.48:.8}/><hemisphereLight args={warm?['#ffe7bf','#201711',.58]:['#dbeafe','#111827',.5]}/><directionalLight position={[6,10,4]} intensity={warm?.55:1.1} castShadow/>{warm&&<><pointLight position={[0,2.8,0]} intensity={1.15} distance={9} color="#ffd6a1"/><pointLight position={[4,3,-2]} intensity={.65} distance={7} color="#f6b6b6"/></>}</>;
}