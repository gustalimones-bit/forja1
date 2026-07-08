import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import HUD from '@/components/HUD';
import BottomNav from '@/components/BottomNav';
import NotificationContainer from '@/components/NotificationContainer';
import MineScene from '@/components/MineScene';
import ForgeScene from '@/components/ForgeScene';
import InventoryPanel from '@/components/InventoryPanel';
import ShopPanel from '@/components/ShopPanel';
import './App.css';

function GameContent() {
  const scene = useGameStore((s) => s.scene);
  switch (scene) {
    case 'mine': return <MineScene />;
    case 'forge': return <ForgeScene />;
    case 'inventory': return <InventoryPanel />;
    case 'shop': return <ShopPanel />;
    default: return <MineScene />;
  }
}

export default function App() {
  const loadGame = useGameStore((s) => s.loadGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const tickAutoMiner = useGameStore((s) => s.tickAutoMiner);

  useEffect(() => { loadGame(); }, [loadGame]);
  useEffect(() => { const i = setInterval(() => tickAutoMiner(), 10000); return () => clearInterval(i); }, [tickAutoMiner]);
  useEffect(() => { const i = setInterval(() => saveGame(), 30000); return () => clearInterval(i); }, [saveGame]);
  useEffect(() => { const h = () => saveGame(); window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [saveGame]);

  return (
    <div className="w-screen h-screen bg-[#0a0a1a] overflow-hidden relative">
      <HUD />
      <GameContent />
      <BottomNav />
      <NotificationContainer />
    </div>
  );
}