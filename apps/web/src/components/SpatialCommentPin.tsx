import { Html } from '@react-three/drei';
import type { SpatialComment } from '@spatial/collaboration';

interface SpatialCommentPinProps {
  comment: SpatialComment;
}

export function SpatialCommentPin({ comment }: SpatialCommentPinProps): JSX.Element {
  return (
    <group position={[comment.position.x, comment.position.y, comment.position.z]}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.6} />
      </mesh>

      <Html position={[0, 0.2, 0]} center distanceFactor={12}>
        <div className="w-48 rounded-lg border border-rose-500/40 bg-slate-900/90 p-2.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between font-semibold text-[11px] text-rose-300">
            <span>{comment.author}</span>
            <span className="text-[9px] text-slate-400">
              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-200 leading-snug">{comment.text}</p>
        </div>
      </Html>
    </group>
  );
}
