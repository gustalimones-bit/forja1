import { useGameStore } from '@/store/gameStore';
import { UPGRADE_DEFS, getUpgradeCost } from '@/game/data';
import { ShoppingBag, Coins, Check } from 'lucide-react';

export default function ShopPanel() {
  const player = useGameStore((s) => s.player);
  const upgrades = useGameStore((s) => s.upgrades);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const totalCrafted = useGameStore((s) => s.totalCrafted);
  const totalSold = useGameStore((s) => s.totalSold);
  const playerLevel = useGameStore((s) => s.player.level);

  return (
    <div className="flex flex-col items-center min-h-screen pt-16 pb-20 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-2xl font-bold text-[#f4d03f] flex items-center gap-2"><ShoppingBag className="w-7 h-7" />Loja de Upgrades</h2>
        <p className="text-sm text-[#a0a0a0] mt-1">Melhore suas ferramentas e capacidades</p>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.values(UPGRADE_DEFS).map((up) => {
          const cl = upgrades[up.id] || 0;
          const maxed = cl >= up.maxLevel;
          const cost = maxed ? 0 : getUpgradeCost(up.id, cl);
          const canAfford = player.gold >= cost;
          return (
            <div key={up.id} className={`bg-[#16213e] rounded-xl border-2 p-4 transition-all ${maxed ? 'border-[#4ecca3]/50' : canAfford ? 'border-[#0f3460] hover:border-[#f4d03f]' : 'border-[#0f3460]/50 opacity-80'}`}>
              <div className="flex items-start justify-between mb-2">
                <div><h3 className="font-bold text-[#eaeaea]">{up.name}</h3><p className="text-xs text-[#a0a0a0] mt-0.5">{up.description}</p></div>
                <div className="text-xs text-[#a0a0a0] bg-[#0f3460]/50 px-2 py-1 rounded">{cl}/{up.maxLevel}</div>
              </div>
              <div className="text-sm text-[#4ecca3] mb-3">{up.effect(cl)}</div>
              <div className="w-full h-2 bg-[#1a1a2e] rounded-full mb-3 overflow-hidden"><div className="h-full bg-[#f4d03f] transition-all" style={{ width: `${(cl / up.maxLevel) * 100}%` }} /></div>
              {maxed ? <div className="flex items-center justify-center gap-2 py-2 text-[#4ecca3] font-bold"><Check className="w-5 h-5" />Máximo</div> : (
                <button onClick={() => buyUpgrade(up.id)} disabled={!canAfford} className={`w-full py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${canAfford ? 'bg-[#f4d03f] hover:bg-[#f9e79f] text-[#1a1a2e] shadow-lg shadow-[#f4d03f]/20' : 'bg-[#0f3460]/30 text-[#a0a0a0] cursor-not-allowed'}`}><Coins className="w-4 h-4" />{cost.toLocaleString()}g</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-2xl mt-6 bg-[#16213e] rounded-xl border-2 border-[#0f3460] p-4">
        <h3 className="text-lg font-bold text-[#eaeaea] mb-3">Estatísticas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-[#1a1a2e] rounded-lg p-3 text-center"><div className="text-[#f4d03f] font-bold text-lg">{totalCrafted}</div><div className="text-[#a0a0a0] text-xs">Armas Forjadas</div></div>
          <div className="bg-[#1a1a2e] rounded-lg p-3 text-center"><div className="text-[#f4d03f] font-bold text-lg">{totalSold}</div><div className="text-[#a0a0a0] text-xs">Armas Vendidas</div></div>
          <div className="bg-[#1a1a2e] rounded-lg p-3 text-center"><div className="text-[#4ecca3] font-bold text-lg">{playerLevel}</div><div className="text-[#a0a0a0] text-xs">Nível Atual</div></div>
        </div>
      </div>
    </div>
  );
}