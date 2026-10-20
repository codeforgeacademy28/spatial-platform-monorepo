import { useEffect, useMemo, useState } from 'react';
import type { SceneAsset, WallSegment } from '@spatial/core';
import * as THREE from 'three';

function useTexture(url:string|undefined):THREE.Texture|null{
 const [texture,setTexture]=useState<THREE.Texture|null>(null);
 useEffect(()=>{if(!url){setTexture(null);return;}let disposed=false;new THREE.TextureLoader().load(url,t=>{if(!disposed){t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;setTexture(t);}},undefined,()=>!disposed&&setTexture(null));return()=>{disposed=true;};},[url]);
 return texture;
}
function GalleryFrame({asset,wall}:{asset:SceneAsset;wall:WallSegment}):JSX.Element{
 const texture=useTexture(asset.assetUrl),length=Math.max(.1,wall.length||Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y)),angle=Math.atan2(wall.end.y-wall.start.y,wall.end.x-wall.start.x),offset=asset.anchor.type==='wall'?asset.anchor.offset-length/2:0,width=asset.anchor.type==='wall'?asset.anchor.width:1,height=asset.anchor.type==='wall'?asset.anchor.height:1,color=asset.frameStyle==='gold'?'#c99a4e':asset.frameStyle==='black'?'#141414':'#5f4a3a';
 return <group position={[(wall.start.x+wall.end.x)/2,asset.anchor.type==='wall'?asset.anchor.elevation+height/2:1,(wall.start.y+wall.end.y)/2]} rotation={[0,-angle,0]}><mesh position={[offset,0,-wall.thickness/2-.06]} castShadow><boxGeometry args={[width+.12,height+.12,.09]}/><meshStandardMaterial color={color} metalness={asset.frameStyle==='gold'?.72:.15} roughness={.28}/></mesh><mesh position={[offset,0,-wall.thickness/2-.12]}><planeGeometry args={[width,height]}/><meshStandardMaterial map={texture??undefined} color={texture?'#fff':'#2b211b'} side={THREE.DoubleSide}/></mesh></group>;
}
function SceneLight({asset,wall}:{asset:SceneAsset;wall:WallSegment}):JSX.Element{
 if(asset.anchor.type!=='wall')return <pointLight position={asset.anchor.position} intensity={asset.light?.intensity??1} distance={asset.light?.distance??5} color={asset.light?.color??'#ffd59b'}/>;
 const length=wall.length||Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y),angle=Math.atan2(wall.end.y-wall.start.y,wall.end.x-wall.start.x),o=asset.anchor.offset-length/2;
 return <pointLight position={[(wall.start.x+wall.end.x)/2+Math.cos(angle)*o,asset.anchor.elevation+.35,(wall.start.y+wall.end.y)/2+Math.sin(angle)*o]} intensity={asset.light?.intensity??.85} distance={asset.light?.distance??4.5} color={asset.light?.color??'#ffd59b'}/>;
}
export function SceneAssetsLayer({walls,assets}:{walls:WallSegment[];assets:SceneAsset[]}):JSX.Element{
 const map=useMemo(()=>new Map(walls.map(w=>[w.id,w])),[walls]);
 return <>{assets.map(a=>{if(a.anchor.type==='wall'){const wall=map.get(a.anchor.wallId);if(!wall)return null;return a.assetType==='image'?<GalleryFrame key={a.id} asset={a} wall={wall}/>:<SceneLight key={a.id} asset={a} wall={wall}/>;}return a.assetType==='light'?<SceneLight key={a.id} asset={a} wall={walls[0]!}/>:null;})}</>;
}