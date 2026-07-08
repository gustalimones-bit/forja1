import { useGameStore } from '@/store/gameStore';
import { Coins, Star, Shield } from 'lucide-react';

export default function HUD() {
  const player = useGameStore((s) => s.player);
  const saveGame = useGameStore((s) => s.saveGame);
  const xpPercent = Math.min(100, (player.xp / player.xpRequired) * 100);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#1a1a2e]/95 border-b-2 border-[#0f3460] backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#16213e] rounded-lg px-3 py-1 border border-[#0f3460]">
            <Shield className="w-5 h-5 text-[#e94560]" />
            <span className="text-[#f4d03f] font-bold text-lg">Lv.{player.level}</span>
          </div>
          <span className="text-[#a0a0a0] text-sm hidden sm:block">{player.title}</span>
        </div>
        <div className="flex-1 mx-4 max-w-xs">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-[#f4d03f]" />
            <div className="flex-1 h-4 bg-[#16213e] rounded-full overflow-hidden border border-[#0f3460]">
              <div className="h-full bg-gradient-to-r from-[#f4d03f] to-[#e94560] transition-all duration-300" style={{ width: `${xpPercent}%` }} />
            </div>
            <span className="text-xs text-[#a0a0a0] whitespace-nowrap">{player.xp}/{player.xpRequired}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#16213e] rounded-lg px-3 py-1 border border-[#f4d03f]/30">
            <Coins className="w-5 h-5 text-[#f4d03f]" />
            <span className="text-[#f4d03f] font-bold text-lg">{player.gold.toLocaleString()}g</span>
          </div>
          <button onClick={saveGame} className="bg-[#0f3460] hover:bg-[#e94560] text-white px-3 py-1 rounded-lg text-sm border border-[#0f3460] hover:border-[#e94560] transition-all">Salvar</button>
        </div>
      </div>
    </div>
  );
}