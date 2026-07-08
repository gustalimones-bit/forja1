import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { WEAPON_DEFS, ORE_DEFS, getQualityColor, getQualityLabel } from '@/game/data';
import type { WeaponType, OreType } from '@/types/game';
import { Flame, Hammer, Droplets, RotateCcw, Check, ArrowRight, Lock } from 'lucide-react';

type ForgePhase = 'select' | 'heating' | 'hammering' | 'quenching' | 'result';

const HAMMER_TARGET_POSITIONS = [{ x: 30, y: 25 }, { x: 65, y: 40 }, { x: 40, y: 65 }];

export default function ForgeScene() {
  const inventory = useGameStore((s) => s.inventory);
  const playerLevel = useGameStore((s) => s.player.level);
  const removeOre = useGameStore((s) => s.removeOreFromInventory);
  const addOre = useGameStore((s) => s.addOreToInventory);
  const addWeapon = useGameStore((s) => s.addWeaponToInventory);
  const addXp = useGameStore((s) => s.addXp);

  const [phase, setPhase] = useState<ForgePhase>('select');
  const [selectedRecipe, setSelectedRecipe] = useState<WeaponType | null>(null);
  const [materials, setMaterials] = useState<{ type: OreType }[]>([]);
  const [temperature, setTemperature] = useState(0);
  const tempDirRef = useRef(1);
  const [heatingScore, setHeatingScore] = useState(0);
  const [hammerIndex, setHammerIndex] = useState(0);
  const [hammerHit, setHammerHit] = useState<boolean | null>(null);
  const [hammerScore, setHammerScore] = useState(0);
  const [hammerTimerDisplay, setHammerTimerDisplay] = useState(100);
  const [quenchFill, setQuenchFill] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [quenchScore, setQuenchScore] = useState(0);
  const [resultQuality, setResultQuality] = useState<'poor' | 'normal' | 'good' | 'masterwork'>('normal');

  const oreCounts: Record<string, number> = {};
  for (const item of inventory) { if (item.type === 'ore' && item.oreType) oreCounts[item.oreType] = (oreCounts[item.oreType] || 0) + item.quantity; }

  const canStartForge = (() => { if (!selectedRecipe) return false; const r = WEAPON_DEFS[selectedRecipe]; return r.oresRequired.every((rq) => materials.filter((m) => m.type === rq.type).length >= rq.count); })();

  useEffect(() => {
    if (phase !== 'heating') return;
    let aid: number;
    const lt = { current: Date.now() };
    const lp = () => { const n = Date.now(); const d = (n - lt.current) / 1000; lt.current = n; setTemperature((p) => { let nt = p + tempDirRef.current * 45 * d; if (nt >= 100) { nt = 100; tempDirRef.current = -1; } else if (nt <= 0) { nt = 0; tempDirRef.current = 1; } return nt; }); aid = requestAnimationFrame(lp); };
    aid = requestAnimationFrame(lp);
    return () => cancelAnimationFrame(aid);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'hammering' || hammerHit !== null) return;
    let iv: ReturnType<typeof setInterval>;
    const st = Date.now();
    iv = setInterval(() => {
      const e = Date.now() - st;
      const r = Math.max(0, 2000 - e);
      setHammerTimerDisplay((r / 2000) * 100);
      if (r <= 0) {
        clearInterval(iv);
        const ni = hammerIndex + 1;
        if (ni >= 3) { setHammerScore((hammerScore + 0) / 3 * 100); setQuenchFill(0); setPhase('quenching'); }
        else { setHammerIndex(ni); setHammerHit(null); }
      }
    }, 50);
    return () => clearInterval(iv);
  }, [phase, hammerIndex, hammerHit, hammerScore]);

  useEffect(() => {
    if (phase !== 'quenching' || !isHolding) return;
    let aid: number;
    const lp = () => { setQuenchFill((p) => Math.min(100, p + 2)); aid = requestAnimationFrame(lp); };
    aid = requestAnimationFrame(lp);
    return () => cancelAnimationFrame(aid);
  }, [phase, isHolding]);

  const selR = useCallback((w: WeaponType) => { setSelectedRecipe(w); setMaterials([]); setPhase('select'); }, []);

  const addM = useCallback((ot: OreType) => {
    if (!selectedRecipe) return;
    const r = WEAPON_DEFS[selectedRecipe];
    const rq = r.oresRequired.find((x) => x.type === ot);
    if (!rq) return;
    if (materials.filter((m) => m.type === ot).length >= rq.count) return;
    const ii = inventory.findIndex((it) => it.type === 'ore' && it.oreType === ot);
    if (ii === -1) return;
    if (inventory[ii].quantity < 1) return;
    removeOre(ot, 1);
    setMaterials((p) => [...p, { type: ot }]);
  }, [selectedRecipe, materials, inventory, removeOre]);

  const remM = useCallback((idx: number) => { const m = materials[idx]; if (!m) return; addOre(m.type, 1); setMaterials((p) => p.filter((_, i) => i !== idx)); }, [materials, addOre]);

  const startH = useCallback(() => { if (!canStartForge) return; setTemperature(0); tempDirRef.current = 1; setHeatingScore(0); setPhase('heating'); }, [canStartForge]);

  const confH = useCallback(() => {
    const sc = temperature >= 35 && temperature <= 65 ? 90 + Math.floor(Math.random() * 11) : Math.max(0, 100 - Math.abs(temperature - 50));
    setHeatingScore(sc); setHammerIndex(0); setHammerHit(null); setHammerScore(0); setPhase('hammering');
  }, [temperature]);

  const hamC = useCallback(() => {
    if (phase !== 'hammering' || hammerHit !== null) return;
    const acc = hammerTimerDisplay / 100;
    const hit = acc > 0.3;
    setHammerHit(hit);
    setTimeout(() => {
      const nh = hit ? hammerScore + 1 : hammerScore;
      const ni = hammerIndex + 1;
      if (ni >= 3) { setHammerScore((nh / 3) * 100); setQuenchFill(0); setPhase('quenching'); }
      else { setHammerIndex(ni); setHammerHit(null); }
    }, 500);
  }, [phase, hammerHit, hammerTimerDisplay, hammerScore, hammerIndex]);

  const confQ = useCallback(() => {
    const sc = quenchFill >= 40 && quenchFill <= 70 ? 90 + Math.floor(Math.random() * 11) : Math.max(0, 100 - Math.abs(quenchFill - 55) * 2);
    setQuenchScore(sc);
    const total = (heatingScore + (hammerScore || 0) + sc) / 3;
    let q: 'poor' | 'normal' | 'good' | 'masterwork' = 'normal';
    if (total >= 85) q = 'masterwork'; else if (total >= 60) q = 'good'; else if (total >= 35) q = 'normal'; else q = 'poor';
    setResultQuality(q);
    if (selectedRecipe) { addWeapon(selectedRecipe, q); addXp(Math.floor(WEAPON_DEFS[selectedRecipe].baseValue * 0.1)); }
    setPhase('result');
  }, [quenchFill, heatingScore, hammerScore, selectedRecipe, addWeapon, addXp]);

  const resetF = useCallback(() => { materials.forEach((m) => addOre(m.type, 1)); setSelectedRecipe(null); setMaterials([]); setPhase('select'); }, [materials, addOre]);
  const finishF = useCallback(() => { setSelectedRecipe(null); setMaterials([]); setPhase('select'); }, []);

  return (
    <div className="flex flex-col items-center min-h-0 pt-16 pb-20 px-4 overflow-y-auto w-full">
      <div className="mb-4 text-center shrink-0">
        <h2 className="text-2xl font-bold text-[#e94560] mb-1 flex items-center gap-2 justify-center"><Flame className="w-7 h-7" />Forja</h2>
        <p className="text-sm text-[#a0a0a0]">{phase === 'select' ? 'Toque numa receita, adicione os materiais e forje!' : 'Complete o minigame para forjar!'}</p>
      </div>

      {phase === 'select' && (
        <div className="w-full max-w-2xl space-y-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(WEAPON_DEFS) as WeaponType[]).map((wId) => {
              const d = WEAPON_DEFS[wId];
              const locked = playerLevel < d.unlockLevel;
              const sel = selectedRecipe === wId;
              const hm = d.oresRequired.every((rq) => (oreCounts[rq.type] || 0) >= rq.count);
              return (
                <button key={wId} onClick={() => { if (!locked) selR(wId); }} disabled={locked}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left w-full min-h-[80px] active:scale-95 ${locked ? 'border-[#0f3460]/30 opacity-50 cursor-not-allowed' : sel ? 'border-[#e94560] bg-[#e94560]/10 shadow-lg shadow-[#e94560]/20' : hm ? 'border-[#4ecca3]/50 bg-[#16213e] hover:border-[#4ecca3]' : 'border-[#0f3460] bg-[#16213e]/50 hover:border-[#0f3460]/80'}`}>
                  {locked && <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]/70 rounded-xl z-10"><Lock className="w-5 h-5 text-[#a0a0a0]" /><span className="ml-1.5 text-sm text-[#a0a0a0] font-bold">Nv.{d.unlockLevel}</span></div>}
                  <div className="font-bold text-[#eaeaea] text-base">{d.name}</div>
                  <div className="text-sm text-[#f4d03f] mt-1">{d.baseValue}g base</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">{d.oresRequired.map((rq, i) => <span key={i} className="text-xs px-2 py-1 rounded-md bg-[#0f3460]/50 text-[#a0a0a0]">{rq.count}x {ORE_DEFS[rq.type].name}</span>)}</div>
                </button>
              );
            })}
          </div>

          {selectedRecipe && (
            <div className="bg-[#16213e] rounded-xl border-2 border-[#0f3460] p-4 animate-fade-in">
              <h4 className="text-lg font-bold text-[#eaeaea] mb-3 flex items-center gap-2"><ArrowRight className="w-5 h-5 text-[#e94560]" />Materiais: {WEAPON_DEFS[selectedRecipe].name}</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {(() => { const r = WEAPON_DEFS[selectedRecipe]; const slots: React.ReactNode[] = []; for (const rq of r.oresRequired) { const ft = materials.filter((m) => m.type === rq.type); for (let si = 0; si < rq.count; si++) { const f = ft[si]; const ho = (oreCounts[rq.type] || 0) > 0; slots.push(
                  <button key={`${rq.type}_${si}`} onClick={() => { if (f) { let c = 0; for (let i = 0; i < materials.length; i++) { if (materials[i].type === rq.type) { if (c === si) { remM(i); return; } c++; } } } else if (ho) addM(rq.type); }}
                    className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90 ${f ? 'border-[#4ecca3] bg-[#4ecca3]/20' : ho ? 'border-[#0f3460] border-dashed hover:border-[#e94560] bg-[#1a1a2e]' : 'border-[#0f3460]/30 border-dashed bg-[#1a1a2e]/50 cursor-not-allowed'}`}>
                    {f ? <div className="w-10 h-10 rounded-lg shadow-lg" style={{ background: ORE_DEFS[f.type].color }} /> : <span className="text-[#a0a0a0] text-lg font-bold">{ORE_DEFS[rq.type].name[0]}</span>}
                  </button>
                ); } } return slots; })()}
              </div>
              {Object.values(ORE_DEFS).filter((o) => (oreCounts[o.id] || 0) > 0).length > 0 && (
                <div className="mb-4"><div className="text-xs text-[#a0a0a0] mb-2">Seus minérios (toque para adicionar):</div><div className="flex flex-wrap gap-2">
                  {Object.values(ORE_DEFS).filter((o) => (oreCounts[o.id] || 0) > 0).map((o) => <button key={o.id} onClick={() => addM(o.id)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f3460]/50 hover:bg-[#0f3460] transition-all text-sm active:scale-95 border border-[#0f3460]/30"><div className="w-4 h-4 rounded" style={{ background: o.color }} /><span className="text-[#eaeaea] font-bold">{o.name}</span><span className="text-[#f4d03f]">x{oreCounts[o.id]}</span></button>)}
                </div></div>
              )}
              {Object.values(ORE_DEFS).filter((o) => (oreCounts[o.id] || 0) > 0).length === 0 && <div className="text-sm text-[#e94560] mb-4 bg-[#e94560]/10 p-3 rounded-lg border border-[#e94560]/30">Você não tem minérios! Vá à mina e mine alguns.</div>}
              <div className="flex gap-3">
                <button onClick={startH} disabled={!canStartForge} className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 active:scale-95 ${canStartForge ? 'bg-[#e94560] hover:bg-[#ff6b7d] text-white shadow-lg shadow-[#e94560]/30' : 'bg-[#0f3460]/50 text-[#a0a0a0] cursor-not-allowed'}`}><Flame className="w-5 h-5" />Iniciar Forja!</button>
                <button onClick={resetF} className="px-5 py-4 rounded-xl bg-[#16213e] hover:bg-[#1a1a2e] text-[#a0a0a0] border border-[#0f3460] transition-all active:scale-95"><RotateCcw className="w-5 h-5" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'heating' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-lg">
          <h3 className="text-xl font-bold text-[#f4d03f] flex items-center gap-2"><Flame className="w-6 h-6 text-[#e94560]" />Fase de Aquecimento</h3>
          <p className="text-sm text-[#a0a0a0] text-center px-4">Clique quando o indicador estiver na zona verde!</p>
          <div className="w-full max-w-xs h-10 bg-[#16213e] rounded-full overflow-hidden border-2 border-[#0f3460] relative mx-4">
            <div className="absolute top-0 bottom-0 bg-green-500/30 rounded-full" style={{ left: '35%', width: '30%' }} />
            <div className={`absolute top-1 bottom-1 w-3 rounded-full transition-none ${temperature >= 35 && temperature <= 65 ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-[#e94560]'}`} style={{ left: `${Math.max(3, Math.min(97, temperature))}%`, transform: 'translateX(-50%)' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: temperature >= 35 && temperature <= 65 ? '#4ecca3' : '#e94560' }}>{Math.round(temperature)}°C</div>
          <button onClick={confH} className={`w-full max-w-xs px-8 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${temperature >= 35 && temperature <= 65 ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-[#e94560] hover:bg-[#ff6b7d] text-white shadow-lg shadow-[#e94560]/30'}`}>Confirmar Aquecimento</button>
        </div>
      )}

      {phase === 'hammering' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-lg">
          <h3 className="text-xl font-bold text-[#f4d03f] flex items-center gap-2"><Hammer className="w-6 h-6 text-[#e94560]" />Fase de Martelada</h3>
          <p className="text-sm text-[#a0a0a0] text-center px-4">Clique quando o círculo estiver no alvo!</p>
          <div className="relative w-72 h-72 bg-[#16213e] rounded-xl border-2 border-[#0f3460] overflow-hidden" onClick={hamC}>
            {HAMMER_TARGET_POSITIONS.map((t, i) => {
              const done = i < hammerIndex;
              const cur = i === hammerIndex;
              const sh = done && i < (hammerScore / 100 * 3 || 0);
              const sm = done && !sh;
              if (!done && !cur) return <div key={i} className="absolute rounded-full border-2 border-[#0f3460]/30 flex items-center justify-center" style={{ left: `${t.x}%`, top: `${t.y}%`, width: 30, height: 30, transform: 'translate(-50%, -50%)' }} />;
              return <div key={i} className={`absolute rounded-full border-2 flex items-center justify-center transition-all ${sh ? 'bg-green-500/30 border-green-400 scale-100' : sm ? 'bg-red-500/30 border-red-400 scale-75' : 'border-[#f4d03f] animate-pulse'}`} style={{ left: `${t.x}%`, top: `${t.y}%`, width: cur ? 50 + (hammerTimerDisplay * 0.5) : 30, height: cur ? 50 + (hammerTimerDisplay * 0.5) : 30, transform: 'translate(-50%, -50%)', opacity: done ? 0.5 : 1 }}>{sh && <Check className="w-5 h-5 text-green-400" />}{sm && <span className="text-red-400 text-sm font-bold">X</span>}{cur && <Hammer className="w-5 h-5 text-[#f4d03f]" />}</div>;
            })}
          </div>
          <div className="text-sm text-[#a0a0a0]">Martelada {hammerIndex + 1} / 3</div>
          <button onClick={hamC} className="w-full max-w-xs px-8 py-4 bg-[#e94560] hover:bg-[#ff6b7d] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#e94560]/30 transition-all active:scale-95">Martelar!</button>
        </div>
      )}

      {phase === 'quenching' && (
        <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-lg">
          <h3 className="text-xl font-bold text-[#f4d03f] flex items-center gap-2"><Droplets className="w-6 h-6 text-blue-400" />Fase de Tempera</h3>
          <p className="text-sm text-[#a0a0a0] text-center px-4">Segure para encher ate a zona verde, solte para confirmar!</p>
          <div className="w-28 h-56 bg-[#16213e] rounded-xl overflow-hidden border-2 border-[#0f3460] relative">
            <div className="absolute left-0 right-0 bg-blue-500/30 border-y-2 border-blue-400/50" style={{ bottom: '40%', height: '30%' }} />
            <div className="absolute bottom-0 left-1 right-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-sm transition-all" style={{ height: `${quenchFill}%` }} />
          </div>
          <div className="text-xl font-bold text-blue-400">{Math.round(quenchFill)}%</div>
          <button onMouseDown={() => setIsHolding(true)} onMouseUp={() => { setIsHolding(false); confQ(); }} onMouseLeave={() => setIsHolding(false)} onTouchStart={(e) => { e.preventDefault(); setIsHolding(true); }} onTouchEnd={(e) => { e.preventDefault(); setIsHolding(false); confQ(); }} className="w-full max-w-xs px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all select-none active:scale-95">{isHolding ? 'Enchendo...' : 'Segure para Encher'}</button>
        </div>
      )}

      {phase === 'result' && selectedRecipe && (
        <div className="flex flex-col items-center gap-6 animate-fade-in w-full max-w-lg">
          <h3 className="text-3xl font-bold" style={{ color: getQualityColor(resultQuality) }}>{getQualityLabel(resultQuality)}!</h3>
          <div className="w-32 h-32 rounded-xl flex items-center justify-center border-4 animate-pulse-glow" style={{ borderColor: getQualityColor(resultQuality), background: `${getQualityColor(resultQuality)}15`, boxShadow: `0 0 40px ${getQualityColor(resultQuality)}40` }}><Hammer className="w-16 h-16" style={{ color: getQualityColor(resultQuality) }} /></div>
          <div className="text-center"><div className="text-xl font-bold text-[#eaeaea]">{WEAPON_DEFS[selectedRecipe].name}</div><div className="text-sm text-[#a0a0a0] mt-2 space-x-2"><span>Aquec: {Math.round(heatingScore)}</span><span>|</span><span>Mart: {Math.round(hammerScore)}</span><span>|</span><span>Temp: {Math.round(quenchScore)}</span></div></div>
          <button onClick={finishF} className="w-full max-w-xs px-8 py-4 bg-[#e94560] hover:bg-[#ff6b7d] text-white rounded-xl font-bold text-lg shadow-lg shadow-[#e94560]/30 transition-all flex items-center justify-center gap-2 active:scale-95"><Check className="w-5 h-5" />Coletar</button>
        </div>
      )}
    </div>
  );
}