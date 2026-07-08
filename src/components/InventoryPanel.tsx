import { useGameStore } from '@/store/gameStore';
import { ORE_DEFS, WEAPON_DEFS, getQualityColor, getQualityLabel } from '@/game/data';
import { Coins, Package, X } from 'lucide-react';

export default function InventoryPanel() {
  const inventory = useGameStore((s) => s.inventory);
  const selectedItemId = useGameStore((s) => s.selectedItemId);
  const setSelectedItem = useGameStore((s) => s.setSelectedItem);
  const sellItem = useGameStore((s) => s.sellItem);
  const sellAllWeapons = useGameStore((s) => s.sellAllWeapons);
  const getInventoryCount = useGameStore((s) => s.getInventoryCount);
  const getInventoryMax = useGameStore((s) => s.getInventoryMax);

  const selectedItem = inventory.find((i) => i.id === selectedItemId);
  const ores = inventory.filter((i) => i.type === 'ore');
  const weapons = inventory.filter((i) => i.type === 'weapon');

  return (
    <div className="flex flex-col items-center min-h-screen pt-16 pb-20 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#eaeaea] flex items-center gap-2"><Package className="w-7 h-7 text-[#4ecca3]" />Mochila</h2>
          <div className="text-sm text-[#a0a0a0]">{getInventoryCount()} / {getInventoryMax()} slots</div>
        </div>
        <div className="w-full h-2 bg-[#16213e] rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-[#4ecca3] transition-all" style={{ width: `${Math.min(100, (getInventoryCount() / getInventoryMax()) * 100)}%` }} />
        </div>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#16213e] rounded-xl border-2 border-[#0f3460] p-4">
          <h3 className="text-lg font-bold text-[#f4d03f] mb-3">Minérios</h3>
          {ores.length === 0 ? <p className="text-sm text-[#a0a0a0] text-center py-4">Nenhum minério. Vá minerar!</p> : (
            <div className="space-y-2">
              {ores.map((item) => (
                <div key={item.id} onClick={() => setSelectedItem(selectedItemId === item.id ? null : item.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedItemId === item.id ? 'bg-[#0f3460]' : 'hover:bg-[#0f3460]/50'}`}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: ORE_DEFS[item.oreType!].color + '30', border: `2px solid ${ORE_DEFS[item.oreType!].color}` }}><div className="w-5 h-5 rounded" style={{ background: ORE_DEFS[item.oreType!].color }} /></div>
                  <div className="flex-1"><div className="text-sm font-bold text-[#eaeaea]">{ORE_DEFS[item.oreType!].name}</div><div className="text-xs text-[#a0a0a0]">x{item.quantity}</div></div>
                  <div className="text-sm text-[#f4d03f]">{item.sellValue}g</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#16213e] rounded-xl border-2 border-[#0f3460] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-[#e94560]">Armas Forjadas</h3>
            {weapons.length > 0 && <button onClick={sellAllWeapons} className="text-xs bg-[#e94560]/20 hover:bg-[#e94560]/40 text-[#e94560] px-2 py-1 rounded transition-all">Vender Todas</button>}
          </div>
          {weapons.length === 0 ? <p className="text-sm text-[#a0a0a0] text-center py-4">Nenhuma arma. Use a forja!</p> : (
            <div className="space-y-2">
              {weapons.map((item) => {
                const qc = getQualityColor(item.quality!);
                return (
                  <div key={item.id} onClick={() => setSelectedItem(selectedItemId === item.id ? null : item.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedItemId === item.id ? 'bg-[#0f3460]' : 'hover:bg-[#0f3460]/50'}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: qc + '20', border: `2px solid ${qc}` }}><span className="text-lg">⚔️</span></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-bold text-[#eaeaea] truncate">{WEAPON_DEFS[item.weaponType!].name}</div><div className="text-xs" style={{ color: qc }}>{getQualityLabel(item.quality!)}</div></div>
                    <div className="text-sm text-[#f4d03f]">{item.sellValue}g</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#16213e] rounded-xl border-2 border-[#0f3460] p-6 max-w-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4"><h4 className="text-lg font-bold text-[#eaeaea]">Detalhes</h4><button onClick={() => setSelectedItem(null)} className="text-[#a0a0a0] hover:text-white transition-all"><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              {selectedItem.type === 'ore' && (<><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg" style={{ background: ORE_DEFS[selectedItem.oreType!].color }} /><div><div className="font-bold text-[#eaeaea]">{ORE_DEFS[selectedItem.oreType!].name}</div><div className="text-sm text-[#a0a0a0]">x{selectedItem.quantity}</div></div></div><div className="text-sm text-[#a0a0a0]">Valor unitário: {selectedItem.sellValue}g</div><div className="text-sm text-[#f4d03f]">Total: {selectedItem.sellValue * selectedItem.quantity}g</div></>)}
              {selectedItem.type === 'weapon' && (<><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: getQualityColor(selectedItem.quality!) + '20', border: `2px solid ${getQualityColor(selectedItem.quality!)}` }}>⚔️</div><div><div className="font-bold text-[#eaeaea]">{WEAPON_DEFS[selectedItem.weaponType!].name}</div><div className="text-sm" style={{ color: getQualityColor(selectedItem.quality!) }}>{getQualityLabel(selectedItem.quality!)}</div></div></div><div className="text-lg text-[#f4d03f] font-bold">Valor: {selectedItem.sellValue}g</div></>)}
              <button onClick={() => { sellItem(selectedItem.id); setSelectedItem(null); }} className="w-full py-3 bg-[#e94560] hover:bg-[#ff6b7d] text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"><Coins className="w-5 h-5" />Vender</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}