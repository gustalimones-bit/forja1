import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ORE_DEFS, GRID_COLS, GRID_ROWS } from '@/game/data';
import type { OreNode } from '@/types/game';

const TILE_SIZE = 72;

function OreSprite({ node, onMine }: { node: OreNode; onMine: (id: string) => void }) {
  const od = ORE_DEFS[node.type];
  const hp = node.hp / node.maxHp;
  const h = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); e.stopPropagation(); onMine(node.id); };
  if (node.state === 'extracted') return <div className="rounded-lg bg-[#16213e]/50 border border-[#0f3460]/30" style={{ width: TILE_SIZE, height: TILE_SIZE }} />;

  return (
    <button onClick={h} onTouchStart={h} className={`relative rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${node.state === 'full' ? 'border-[#0f3460] hover:border-[#e94560]' : ''} ${node.state === 'cracked' ? 'border-yellow-600/50' : ''} ${node.state === 'broken' ? 'border-red-600/50' : ''}`} style={{ width: TILE_SIZE, height: TILE_SIZE, background: `linear-gradient(135deg, ${od.color}30, ${od.color}15)` }}>
      <div className={`rounded-md transition-all ${node.state === 'full' ? 'animate-float' : ''} ${node.state === 'cracked' ? 'animate-shake' : ''}`} style={{ width: TILE_SIZE * 0.6, height: TILE_SIZE * 0.6, background: `radial-gradient(circle at 30% 30%, ${od.color}, ${od.color}88)`, boxShadow: `0 0 15px ${od.color}40` }}>
        {node.state === 'cracked' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-0.5 bg-[#1a1a2e] rotate-45 absolute" /><div className="w-3 h-0.5 bg-[#1a1a2e] -rotate-12 absolute top-3 left-2" /></div>}
        {node.state === 'broken' && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-0.5 bg-[#1a1a2e] rotate-30 absolute" /><div className="w-4 h-0.5 bg-[#1a1a2e] -rotate-45 absolute" /><div className="w-3 h-0.5 bg-[#1a1a2e] rotate-12 absolute bottom-3" /></div>}
      </div>
      <div className="absolute bottom-1 left-1 right-1 h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${hp * 100}%`, background: hp > 0.5 ? '#4ecca3' : hp > 0.25 ? '#f4d03f' : '#e74c3c' }} />
      </div>
      {(od.rarity === 'rare' || od.rarity === 'epic' || od.rarity === 'legendary') && <div className="absolute inset-0 rounded-lg animate-pulse-glow pointer-events-none" style={{ color: od.color, opacity: 0.15 }} />}
    </button>
  );
}

export default function MineScene() {
  const oreNodes = useGameStore((s) => s.oreNodes);
  const mineOre = useGameStore((s) => s.mineOre);
  const tickRespawns = useGameStore((s) => s.tickRespawns);
  const lastRef = useRef(Date.now());

  useEffect(() => {
    const i = setInterval(() => { const n = Date.now(); const d = (n - lastRef.current) / 1000; lastRef.current = n; tickRespawns(d * 1000); }, 100);
    return () => clearInterval(i);
  }, [tickRespawns]);

  const h = useCallback((id: string) => mineOre(id), [mineOre]);
  const g = Array.from({ length: GRID_ROWS }, (_, r) => Array.from({ length: GRID_COLS }, (_, c) => oreNodes.find((n) => n.x === c && n.y === r)));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-16 pb-20 px-4">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-[#f4d03f] mb-1">Mina</h2>
        <p className="text-sm text-[#a0a0a0]">Clique nos minérios para minerar</p>
      </div>
      <div className="inline-grid gap-1 p-3 bg-[#16213e]/80 rounded-xl border-2 border-[#0f3460]" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, ${TILE_SIZE}px)` }}>
        {g.map((r, ri) => r.map((n, ci) => n ? <OreSprite key={n.id} node={n} onMine={h} /> : <div key={`e_${ri}_${ci}`} className="rounded-lg bg-[#1a1a2e]/30 border border-[#0f3460]/10" style={{ width: TILE_SIZE, height: TILE_SIZE }} />))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 justify-center">
        {Object.values(ORE_DEFS).map((o) => <div key={o.id} className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded" style={{ background: o.color, boxShadow: `0 0 6px ${o.color}50` }} /><span className="text-[#a0a0a0]">{o.name}</span></div>)}
      </div>
    </div>
  );
}