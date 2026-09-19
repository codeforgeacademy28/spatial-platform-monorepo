import type { WallOpening, WallSegment } from '@spatial/core';

interface SceneWallMeshProps {
  wall: WallSegment;
  openings?: WallOpening[];
  highlighted?: boolean;
}

export function SceneWallMesh({ wall, openings = [], highlighted = false }: SceneWallMeshProps): JSX.Element {
  const length = Math.max(0.001, wall.length || Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y));
  const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
  const active = openings.filter((opening) => opening.wallId === wall.id).map((opening) => ({
    ...opening,
    width: Math.min(opening.width, length - 0.05),
    offset: Math.min(Math.max(opening.offset, opening.width / 2), length - opening.width / 2),
    top: Math.min(wall.height, opening.bottom + opening.height),
  })).sort((a,b)=>a.offset-b.offset);
  const segments: Array<{x:number;y:number;width:number;height:number}>=[];
  if (!active.length) segments.push({x:0,y:wall.height/2,width:length,height:wall.height});
  else {
    let cursor=0;
    for(const opening of active){
      const left=opening.offset-opening.width/2, right=opening.offset+opening.width/2;
      if(left>cursor) segments.push({x:(cursor+left)/2-length/2,y:wall.height/2,width:left-cursor,height:wall.height});
      if(opening.bottom>0) segments.push({x:(left+right)/2-length/2,y:opening.bottom/2,width:right-left,height:opening.bottom});
      if(opening.top<wall.height) segments.push({x:(left+right)/2-length/2,y:(opening.top+wall.height)/2,width:right-left,height:wall.height-opening.top});
      cursor=Math.max(cursor,right);
    }
    if(cursor<length) segments.push({x:(cursor+length)/2-length/2,y:wall.height/2,width:length-cursor,height:wall.height});
  }
  return <group position={[(wall.start.x+wall.end.x)/2,0,(wall.start.y+wall.end.y)/2]} rotation={[0,-angle,0]}>
    {segments.map((segment,index)=><mesh key={index} position={[segment.x,segment.y,0]} castShadow receiveShadow>
      <boxGeometry args={[Math.max(.001,segment.width),Math.max(.001,segment.height),wall.thickness]}/>
      <meshStandardMaterial color={highlighted?'#f8c37a':wall.materialHex??'#efe7dc'} emissive={highlighted?'#d97706':'#000'} emissiveIntensity={highlighted?.55:0} roughness={.72}/>
    </mesh>)}
  </group>;
}