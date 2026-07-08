import { useGameStore } from '@/store/gameStore';
import type { GameScene } from '@/types/game';
import { Pickaxe, Flame, Backpack, ShoppingBag } from 'lucide-react';

const tabs: { id: GameScene; label: string; icon: React.ReactNode }[] = [
  { id: 'mine', label: 'Mina', icon: <Pickaxe className="w-5 h-5" /> },
  { id: 'forge', label: 'Forja', icon: <Flame className="w-5 h-5" /> },
  { id: 'inventory', label: 'Mochila', icon: <Backpack className="w-5 h-5" /> },
  { id: 'shop', label: 'Loja', icon: <ShoppingBag className="w-5 h-5" /> },
];

export default function BottomNav() {
  const scene = useGameStore((s) => s.scene);
  const setScene = useGameStore((s) => s.setScene);
  const inventory = useGameStore((s) => s.inventory);
  const weaponCount = inventory.filter((i) => i.type === 'weapon').length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1a1a2e]/95 border-t-2 border-[#0f3460] backdrop-blur-sm">
      <div className="flex items-center justify-around px-4 py-2">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setScene(tab.id)} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${scene === tab.id ? 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/30' : 'text-[#a0a0a0] hover:text-white hover:bg-[#16213e]'}`}>
            {tab.icon}
            <span className="text-xs font-bold">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}