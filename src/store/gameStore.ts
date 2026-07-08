import { create } from 'zustand';
import type { GameState, OreNode, Notification, OreType, WeaponType, GameScene } from '@/types/game';
import { ORE_DEFS, WEAPON_DEFS, UPGRADE_DEFS, getXpRequired, getTitleForLevel, calculateQuality, getQualityMultiplier, getUpgradeCost, GRID_COLS, GRID_ROWS } from '@/game/data';

let _nid = 0;
const nextId = () => `nid_${++_nid}`;

function generateOreNodes(): OreNode[] {
  const nodes: OreNode[] = [];
  const used = new Set<string>();
  const available = Object.values(ORE_DEFS).filter((o) => o.unlockDepth <= 1);
  for (let i = 0; i < 18; i++) {
    let x: number, y: number, key: string, attempts = 0;
    do { x = Math.floor(Math.random() * GRID_COLS); y = Math.floor(Math.random() * GRID_ROWS); key = `${x},${y}`; attempts++; } while (used.has(key) && attempts < 100);
    if (used.has(key)) continue;
    used.add(key);
    const od = available[Math.floor(Math.random() * available.length)];
    nodes.push({ id: `ore_${i}`, type: od.id, x, y, hp: od.hp, maxHp: od.hp, state: 'full', respawnTimer: 0 });
  }
  return nodes;
}

const iFS = { phase: 'select' as const, selectedRecipe: null, materials: [], heatingScore: 0, hammeringScore: 0, quenchingScore: 0, temperature: 0, tempDirection: 1, tempTarget: 50, tempGreenZone: { min: 35, max: 65 }, hammerTargets: [], currentHammerIndex: 0, quenchFill: 0, quenchTarget: { min: 40, max: 70 }, resultQuality: null, resultWeapon: null };
const iS: GameState = { scene: 'mine', player: { level: 1, xp: 0, xpRequired: getXpRequired(1), gold: 50, title: 'Aprendiz' }, inventory: [], upgrades: { pickaxe: 0, forgeEfficiency: 0, autoMiner: 0, bagSize: 0, luckCharm: 0, furnaceUpgrade: 0 }, oreNodes: generateOreNodes(), forge: { ...iFS }, notifications: [], lastSaveTime: Date.now(), totalMined: { copper: 0, iron: 0, silver: 0, gold: 0, mithril: 0, adamantite: 0, dragonite: 0 }, totalCrafted: 0, totalSold: 0, autoMinerActive: false, selectedItemId: null };

interface GameStore extends GameState {
  setScene: (scene: GameScene) => void;
  mineOre: (nodeId: string) => void;
  tickRespawns: (delta: number) => void;
  addOreToInventory: (oreType: OreType, quantity?: number) => void;
  removeOreFromInventory: (oreType: OreType, quantity: number) => boolean;
  addWeaponToInventory: (weaponType: WeaponType, quality: 'poor' | 'normal' | 'good' | 'masterwork') => void;
  sellItem: (itemId: string) => void;
  sellAllWeapons: () => void;
  getInventoryCount: () => number;
  getInventoryMax: () => number;
  getOreCount: (oreType: OreType) => number;
  addMaterial: (oreType: OreType) => boolean;
  removeMaterial: (index: number) => void;
  startHeating: () => void;
  updateTemperature: (delta: number) => void;
  confirmHeating: () => void;
  hitHammerTarget: (accuracy: number) => void;
  updateQuench: (value: number) => void;
  confirmQuench: () => void;
  finishForge: () => void;
  resetForge: () => void;
  buyUpgrade: (upgradeId: string) => boolean;
  getUpgradeCost: (upgradeId: string) => number;
  addXp: (amount: number) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  tickAutoMiner: () => void;
  addNotification: (message: string, type?: Notification['type']) => void;
  removeNotification: (id: string) => void;
  saveGame: () => void;
  loadGame: () => boolean;
  setSelectedItem: (itemId: string | null) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...JSON.parse(JSON.stringify(iS)),

  setScene: (scene) => set({ scene }),

  mineOre: (nodeId) => {
    const s = get();
    const node = s.oreNodes.find((n) => n.id === nodeId);
    if (!node || node.state === 'extracted') return;
    const dmg = 1 + s.upgrades.pickaxe;
    const newHp = Math.max(0, node.hp - dmg);
    const od = ORE_DEFS[node.type];
    let st: OreNode['state'] = node.state;
    if (newHp <= 0) st = 'extracted';
    else if (newHp <= node.maxHp * 0.25) st = 'broken';
    else if (newHp <= node.maxHp * 0.5) st = 'cracked';
    const updated = s.oreNodes.map((n) => n.id === nodeId ? { ...n, hp: newHp, state: st } : n);
    if (st === 'extracted') {
      const y = Math.floor(Math.random() * 2) + 1;
      const ni = [...s.inventory];
      const es = ni.find((it) => it.type === 'ore' && it.oreType === node.type);
      if (es) es.quantity += y; else ni.push({ id: nextId(), type: 'ore', oreType: node.type, quantity: y, sellValue: od.sellValue });
      const nx = s.player.xp + od.xpValue * y;
      let nl = s.player.level, nr = s.player.xpRequired, nt = s.player.title;
      if (nx >= s.player.xpRequired) { nl++; nr = getXpRequired(nl); nt = getTitleForLevel(nl); }
      const tm = { ...s.totalMined, [node.type]: s.totalMined[node.type] + y };
      set({ oreNodes: updated, inventory: ni, player: { ...s.player, xp: nx, level: nl, xpRequired: nr, title: nt }, totalMined: tm });
      if (nl > s.player.level) get().addNotification(`Nível ${nl}! ${nt}!`, 'success');
    } else set({ oreNodes: updated });
  },

  tickRespawns: (delta) => {
    const s = get();
    const u = s.oreNodes.map((n) => {
      if (n.state === 'extracted') {
        const od = ORE_DEFS[n.type];
        const nt = n.respawnTimer + delta;
        if (nt >= od.respawnTime) {
          const ao = Object.values(ORE_DEFS).filter((o) => o.unlockDepth <= s.player.level);
          const no = ao[Math.floor(Math.random() * ao.length)];
          return { ...n, type: no.id, hp: no.hp, maxHp: no.hp, state: 'full' as const, respawnTimer: 0 };
        }
        return { ...n, respawnTimer: nt };
      }
      return n;
    });
    set({ oreNodes: u });
  },

  addOreToInventory: (ot, q = 1) => {
    const s = get();
    const od = ORE_DEFS[ot];
    const ni = [...s.inventory];
    const es = ni.find((it) => it.type === 'ore' && it.oreType === ot);
    if (es) es.quantity += q; else ni.push({ id: nextId(), type: 'ore', oreType: ot, quantity: q, sellValue: od.sellValue });
    set({ inventory: ni });
  },

  removeOreFromInventory: (ot, q) => {
    const s = get();
    const ii = s.inventory.findIndex((it) => it.type === 'ore' && it.oreType === ot);
    if (ii === -1) return false;
    const it = s.inventory[ii];
    if (it.quantity < q) return false;
    const ni = [...s.inventory];
    ni[ii] = { ...it, quantity: it.quantity - q };
    if (ni[ii].quantity <= 0) ni.splice(ii, 1);
    set({ inventory: ni });
    return true;
  },

  addWeaponToInventory: (wt, q) => {
    const s = get();
    const wd = WEAPON_DEFS[wt];
    const m = getQualityMultiplier(q);
    const sv = Math.floor(wd.baseValue * m);
    set({ inventory: [...s.inventory, { id: nextId(), type: 'weapon', weaponType: wt, quality: q, quantity: 1, sellValue: sv }], totalCrafted: s.totalCrafted + 1 });
  },

  sellItem: (id) => {
    const s = get();
    const it = s.inventory.find((i) => i.id === id);
    if (!it) return;
    const g = it.sellValue * it.quantity;
    set({ inventory: s.inventory.filter((i) => i.id !== id), player: { ...s.player, gold: s.player.gold + g }, totalSold: s.totalSold + it.quantity });
    get().addNotification(`+${g}g`, 'success');
  },

  sellAllWeapons: () => {
    const s = get();
    const w = s.inventory.filter((i) => i.type === 'weapon');
    if (!w.length) return;
    const tg = w.reduce((sm, x) => sm + x.sellValue * x.quantity, 0);
    set({ inventory: s.inventory.filter((i) => i.type !== 'weapon'), player: { ...s.player, gold: s.player.gold + tg }, totalSold: s.totalSold + w.length });
    get().addNotification(`Vendeu ${w.length} armas! +${tg}g`, 'success');
  },

  getInventoryCount: () => get().inventory.reduce((sm, it) => sm + (it.type === 'ore' ? 1 : it.quantity), 0),
  getInventoryMax: () => 20 + get().upgrades.bagSize * 5,
  getOreCount: (ot) => { const it = get().inventory.find((i) => i.type === 'ore' && i.oreType === ot); return it ? it.quantity : 0; },

  addMaterial: (ot) => {
    const s = get();
    if (!s.forge.selectedRecipe) return false;
    const r = WEAPON_DEFS[s.forge.selectedRecipe];
    const rq = r.oresRequired.find((x) => x.type === ot);
    if (!rq) return false;
    const cc = s.forge.materials.filter((m) => m.type === ot).length;
    if (cc >= rq.count) return false;
    const ii = s.inventory.findIndex((it) => it.type === 'ore' && it.oreType === ot);
    if (ii === -1) return false;
    const it = s.inventory[ii];
    if (it.quantity < 1) return false;
    const ni = [...s.inventory];
    ni[ii] = { ...it, quantity: it.quantity - 1 };
    if (ni[ii].quantity <= 0) ni.splice(ii, 1);
    set({ inventory: ni, forge: { ...s.forge, materials: [...s.forge.materials, { type: ot, count: 1 }] } });
    return true;
  },

  removeMaterial: (idx) => {
    const s = get();
    const m = s.forge.materials[idx];
    if (!m) return;
    s.addOreToInventory(m.type, 1);
    set({ forge: { ...s.forge, materials: s.forge.materials.filter((_, i) => i !== idx) } });
  },

  startHeating: () => {
    const s = get();
    const fl = s.upgrades.furnaceUpgrade;
    const gw = 30 + fl * 8;
    const c = 50;
    set({ forge: { ...s.forge, phase: 'heating', temperature: 0, tempDirection: 1, tempGreenZone: { min: c - gw / 2, max: c + gw / 2 } } });
  },

  updateTemperature: (d) => {
    const s = get();
    if (s.forge.phase !== 'heating') return;
    let nt = s.forge.temperature + s.forge.tempDirection * 40 * d;
    let nd = s.forge.tempDirection;
    if (nt >= 100) { nt = 100; nd = -1; } else if (nt <= 0) { nt = 0; nd = 1; }
    set({ forge: { ...s.forge, temperature: nt, tempDirection: nd } });
  },

  confirmHeating: () => {
    const s = get();
    const { temperature, tempGreenZone } = s.forge;
    let sc = 0;
    if (temperature >= tempGreenZone.min && temperature <= tempGreenZone.max) sc = 90 + Math.floor(Math.random() * 11);
    else sc = Math.max(0, 100 - Math.abs(temperature - 50));
    const t = Array.from({ length: 3 }, () => ({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, hit: null as boolean | null }));
    set({ forge: { ...s.forge, phase: 'hammering', heatingScore: sc, hammerTargets: t, currentHammerIndex: 0 } });
  },

  hitHammerTarget: (acc) => {
    const s = get();
    const { hammerTargets, currentHammerIndex } = s.forge;
    if (currentHammerIndex >= hammerTargets.length) return;
    const nt = [...hammerTargets];
    nt[currentHammerIndex] = { ...nt[currentHammerIndex], hit: acc > 0.7 };
    const ni = currentHammerIndex + 1;
    if (ni >= hammerTargets.length) {
      const h = nt.filter((x) => x.hit).length;
      const sc = (h / nt.length) * 100;
      set({ forge: { ...s.forge, hammerTargets: nt, currentHammerIndex: ni, hammeringScore: sc, phase: 'quenching', quenchFill: 0 } });
    } else {
      set({ forge: { ...s.forge, hammerTargets: nt, currentHammerIndex: ni } });
    }
  },

  updateQuench: (v) => set({ forge: { ...get().forge, quenchFill: v } }),

  confirmQuench: () => {
    const s = get();
    const { quenchFill, quenchTarget } = s.forge;
    let sc = 0;
    if (quenchFill >= quenchTarget.min && quenchFill <= quenchTarget.max) sc = 90 + Math.floor(Math.random() * 11);
    else { const tc = (quenchTarget.min + quenchTarget.max) / 2; sc = Math.max(0, 100 - Math.abs(quenchFill - tc) * 2); }
    const fb = s.upgrades.forgeEfficiency * 5;
    const q = calculateQuality(s.forge.heatingScore, s.forge.hammeringScore, sc, fb);
    set({ forge: { ...s.forge, phase: 'result', quenchingScore: sc, resultQuality: q, resultWeapon: s.forge.selectedRecipe } });
    if (s.forge.selectedRecipe) { s.addWeaponToInventory(s.forge.selectedRecipe, q); s.addXp(Math.floor(WEAPON_DEFS[s.forge.selectedRecipe].baseValue * 0.1)); }
  },

  finishForge: () => set({ forge: { ...iFS } }),

  resetForge: () => {
    const s = get();
    s.forge.materials.forEach((m) => s.addOreToInventory(m.type, 1));
    set({ forge: { ...iFS } });
  },

  buyUpgrade: (uid) => {
    const s = get();
    const c = getUpgradeCost(uid, s.upgrades[uid] || 0);
    if (s.player.gold < c) return false;
    if (s.upgrades[uid] >= UPGRADE_DEFS[uid].maxLevel) return false;
    set({ player: { ...s.player, gold: s.player.gold - c }, upgrades: { ...s.upgrades, [uid]: (s.upgrades[uid] || 0) + 1 } });
    get().addNotification(`${UPGRADE_DEFS[uid].name} melhorado!`, 'success');
    return true;
  },

  getUpgradeCost: (uid) => getUpgradeCost(uid, get().upgrades[uid] || 0),

  addXp: (a) => {
    const s = get();
    let nx = s.player.xp + a, nl = s.player.level, nr = s.player.xpRequired, nt = s.player.title;
    while (nx >= nr) { nx -= nr; nl++; nr = getXpRequired(nl); nt = getTitleForLevel(nl); }
    set({ player: { ...s.player, xp: nx, level: nl, xpRequired: nr, title: nt } });
    if (nl > s.player.level) get().addNotification(`Nível ${nl}! ${nt}!`, 'success');
  },

  addGold: (a) => set({ player: { ...get().player, gold: get().player.gold + a } }),

  spendGold: (a) => {
    const s = get();
    if (s.player.gold < a) return false;
    set({ player: { ...s.player, gold: s.player.gold - a } });
    return true;
  },

  tickAutoMiner: () => {
    const s = get();
    const aml = s.upgrades.autoMiner;
    if (aml <= 0) return;
    const av = s.oreNodes.filter((n) => n.state !== 'extracted');
    if (!av.length) return;
    const ntm = Math.min(aml, av.length);
    for (let i = 0; i < ntm; i++) {
      const node = av[Math.floor(Math.random() * av.length)];
      if (node.state === 'extracted') continue;
      const od = ORE_DEFS[node.type];
      const ya = Math.floor(Math.random() * 2) + 1;
      const es = s.inventory.find((it) => it.type === 'ore' && it.oreType === node.type);
      if (es) es.quantity += ya; else s.inventory.push({ id: nextId(), type: 'ore', oreType: node.type, quantity: ya, sellValue: od.sellValue });
      const ao = Object.values(ORE_DEFS).filter((o) => o.unlockDepth <= s.player.level);
      const no = ao[Math.floor(Math.random() * ao.length)];
      node.type = no.id; node.hp = no.hp; node.maxHp = no.hp; node.state = 'full'; node.respawnTimer = 0;
      s.totalMined[node.type] += ya;
    }
    set({ inventory: [...s.inventory], oreNodes: [...s.oreNodes], totalMined: { ...s.totalMined } });
  },

  addNotification: (msg, t = 'info') => {
    const n: Notification = { id: nextId(), message: msg, type: t, timestamp: Date.now() };
    set({ notifications: [...get().notifications, n] });
    setTimeout(() => get().removeNotification(n.id), 3000);
  },

  removeNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),

  saveGame: () => {
    const s = get();
    const d = { player: s.player, inventory: s.inventory, upgrades: s.upgrades, totalMined: s.totalMined, totalCrafted: s.totalCrafted, totalSold: s.totalSold, lastSaveTime: Date.now() };
    localStorage.setItem('forge_master_save', JSON.stringify(d));
    get().addNotification('Jogo salvo!', 'info');
  },

  loadGame: () => {
    try {
      const sv = localStorage.getItem('forge_master_save');
      if (!sv) return false;
      const d = JSON.parse(sv);
      set({ player: d.player || iS.player, inventory: d.inventory || [], upgrades: d.upgrades || iS.upgrades, totalMined: d.totalMined || iS.totalMined, totalCrafted: d.totalCrafted || 0, totalSold: d.totalSold || 0, lastSaveTime: d.lastSaveTime || Date.now() });
      get().addNotification('Progresso carregado!', 'info');
      return true;
    } catch { return false; }
  },

  setSelectedItem: (id) => set({ selectedItemId: id }),
}));