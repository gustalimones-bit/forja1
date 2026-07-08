import type { OreDef, WeaponDef, UpgradeDef } from '@/types/game';

export const ORE_DEFS: Record<string, OreDef> = {
  copper: { id: 'copper', name: 'Cobre', color: '#b87333', rarity: 'common', hp: 3, respawnTime: 5000, sellValue: 2, unlockDepth: 1, xpValue: 5 },
  iron: { id: 'iron', name: 'Ferro', color: '#7f8c8d', rarity: 'common', hp: 4, respawnTime: 8000, sellValue: 5, unlockDepth: 1, xpValue: 10 },
  silver: { id: 'silver', name: 'Prata', color: '#c0c0c0', rarity: 'uncommon', hp: 5, respawnTime: 12000, sellValue: 12, unlockDepth: 4, xpValue: 25 },
  gold: { id: 'gold', name: 'Ouro', color: '#f4d03f', rarity: 'uncommon', hp: 6, respawnTime: 15000, sellValue: 25, unlockDepth: 6, xpValue: 50 },
  mithril: { id: 'mithril', name: 'Mithril', color: '#3498db', rarity: 'rare', hp: 8, respawnTime: 20000, sellValue: 60, unlockDepth: 8, xpValue: 120 },
  adamantite: { id: 'adamantite', name: 'Adamantita', color: '#e74c3c', rarity: 'epic', hp: 10, respawnTime: 30000, sellValue: 150, unlockDepth: 12, xpValue: 300 },
  dragonite: { id: 'dragonite', name: 'Dragonita', color: '#9b59b6', rarity: 'legendary', hp: 15, respawnTime: 60000, sellValue: 500, unlockDepth: 20, xpValue: 1000 },
};

export const ORE_TYPES = Object.keys(ORE_DEFS) as (keyof typeof ORE_DEFS)[];

export const WEAPON_DEFS: Record<string, WeaponDef> = {
  dagger: { id: 'dagger', name: 'Adaga de Cobre', oresRequired: [{ type: 'copper', count: 3 }], baseValue: 15, unlockLevel: 1 },
  sword: { id: 'sword', name: 'Espada de Ferro', oresRequired: [{ type: 'iron', count: 4 }], baseValue: 60, unlockLevel: 2 },
  axe: { id: 'axe', name: 'Machado de Ferro', oresRequired: [{ type: 'iron', count: 6 }], baseValue: 80, unlockLevel: 3 },
  rapier: { id: 'rapier', name: 'Florete de Prata', oresRequired: [{ type: 'silver', count: 5 }], baseValue: 150, unlockLevel: 4 },
  broadsword: { id: 'broadsword', name: 'Espada Larga de Ouro', oresRequired: [{ type: 'gold', count: 5 }], baseValue: 300, unlockLevel: 6 },
  greatsword: { id: 'greatsword', name: 'Espada Grande de Mithril', oresRequired: [{ type: 'mithril', count: 4 }], baseValue: 800, unlockLevel: 8 },
  excalibur: { id: 'excalibur', name: 'Excalibur de Dragonita', oresRequired: [{ type: 'dragonite', count: 8 }], baseValue: 10000, unlockLevel: 20 },
};

export const WEAPON_TYPES = Object.keys(WEAPON_DEFS) as (keyof typeof WEAPON_DEFS)[];

export const UPGRADE_DEFS: Record<string, UpgradeDef> = {
  pickaxe: { id: 'pickaxe', name: 'Picareta Melhorada', description: 'Reduz hits necessários para minerar', maxLevel: 5, baseCost: 100, costScaling: 3, effect: (l: number) => `-${l} hit${l > 1 ? 's' : ''} para minerar` },
  forgeEfficiency: { id: 'forgeEfficiency', name: 'Eficiência da Forja', description: 'Aumenta a qualidade base das armas', maxLevel: 10, baseCost: 200, costScaling: 2.5, effect: (l: number) => `+${l * 5}% qualidade` },
  autoMiner: { id: 'autoMiner', name: 'Minerador Automático', description: 'Minera um minério automaticamente a cada 10s', maxLevel: 5, baseCost: 500, costScaling: 4, effect: (l: number) => `${l} minério${l > 1 ? 's' : ''}/10s` },
  bagSize: { id: 'bagSize', name: 'Mochila Maior', description: 'Aumenta o espaço do inventário', maxLevel: 6, baseCost: 150, costScaling: 2, effect: (l: number) => `+${l * 5} slots` },
  luckCharm: { id: 'luckCharm', name: 'Amuleto da Sorte', description: 'Aumenta chance de minérios raros', maxLevel: 5, baseCost: 300, costScaling: 3, effect: (l: number) => `+${l * 5}% raros` },
  furnaceUpgrade: { id: 'furnaceUpgrade', name: 'Forno Aprimorado', description: 'Aumenta a zona verde do aquecimento', maxLevel: 5, baseCost: 250, costScaling: 2.5, effect: (l: number) => `+${l * 8}% zona verde` },
};

export const UPGRADE_TYPES = Object.keys(UPGRADE_DEFS) as (keyof typeof UPGRADE_DEFS)[];

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Aprendiz', 2: 'Ferreiro Novato', 4: 'Oficial', 6: 'Ferreiro Especialista',
  8: 'Mestre Ferreiro', 10: 'Mestre da Forja', 15: 'Lendário', 20: 'Forge Master',
  30: 'Deus da Forja', 50: 'Transcendental',
};

export function getXpRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getTitleForLevel(level: number): string {
  let title = 'Aprendiz';
  const thresholds = Object.keys(LEVEL_TITLES).map(Number).sort((a, b) => a - b);
  for (const t of thresholds) { if (level >= t) title = LEVEL_TITLES[t]; }
  return title;
}

export function calculateQuality(h: number, ha: number, q: number, b: number): 'poor' | 'normal' | 'good' | 'masterwork' {
  const total = (h + ha + q) / 3 + b;
  if (total >= 85) return 'masterwork';
  if (total >= 60) return 'good';
  if (total >= 35) return 'normal';
  return 'poor';
}

export function getQualityMultiplier(q: 'poor' | 'normal' | 'good' | 'masterwork'): number {
  return { poor: 0.5, normal: 1, good: 1.5, masterwork: 2.5 }[q];
}

export function getQualityColor(q: 'poor' | 'normal' | 'good' | 'masterwork'): string {
  return { poor: '#7f8c8d', normal: '#eaeaea', good: '#4ecca3', masterwork: '#f4d03f' }[q];
}

export function getQualityLabel(q: 'poor' | 'normal' | 'good' | 'masterwork'): string {
  return { poor: 'Ruim', normal: 'Normal', good: 'Bom', masterwork: 'Obra-prima' }[q];
}

export function getUpgradeCost(id: string, level: number): number {
  const d = UPGRADE_DEFS[id];
  return d ? Math.floor(d.baseCost * Math.pow(d.costScaling, level)) : 0;
}

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const TILE_SIZE = 64;

export const RARITY_COLORS: Record<string, string> = {
  common: '#7f8c8d', uncommon: '#4ecca3', rare: '#3498db', epic: '#e74c3c', legendary: '#f4d03f',
};