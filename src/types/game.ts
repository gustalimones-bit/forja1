export type OreType = 'copper' | 'iron' | 'silver' | 'gold' | 'mithril' | 'adamantite' | 'dragonite';
export type WeaponType = 'dagger' | 'sword' | 'axe' | 'rapier' | 'broadsword' | 'greatsword' | 'excalibur';
export type Quality = 'poor' | 'normal' | 'good' | 'masterwork';
export type GameScene = 'mine' | 'forge' | 'inventory' | 'shop' | 'menu' | 'paused';
export type ForgePhase = 'select' | 'heating' | 'hammering' | 'quenching' | 'result';

export interface OreDef {
  id: OreType;
  name: string;
  color: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  hp: number;
  respawnTime: number;
  sellValue: number;
  unlockDepth: number;
  xpValue: number;
}

export interface WeaponDef {
  id: WeaponType;
  name: string;
  oresRequired: { type: OreType; count: number }[];
  baseValue: number;
  unlockLevel: number;
}

export interface OreNode {
  id: string;
  type: OreType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  state: 'full' | 'cracked' | 'broken' | 'extracted';
  respawnTimer: number;
}

export interface InventoryItem {
  id: string;
  type: 'ore' | 'weapon';
  oreType?: OreType;
  weaponType?: WeaponType;
  quality?: Quality;
  quantity: number;
  sellValue: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costScaling: number;
  effect: (level: number) => string;
}

export interface PlayerState {
  level: number;
  xp: number;
  xpRequired: number;
  gold: number;
  title: string;
}

export interface ForgeState {
  phase: ForgePhase;
  selectedRecipe: WeaponType | null;
  materials: { type: OreType; count: number }[];
  heatingScore: number;
  hammeringScore: number;
  quenchingScore: number;
  temperature: number;
  tempDirection: number;
  tempTarget: number;
  tempGreenZone: { min: number; max: number };
  hammerTargets: { x: number; y: number; hit: boolean | null }[];
  currentHammerIndex: number;
  quenchFill: number;
  quenchTarget: { min: number; max: number };
  resultQuality: Quality | null;
  resultWeapon: WeaponType | null;
}

export interface GameState {
  scene: GameScene;
  player: PlayerState;
  inventory: InventoryItem[];
  upgrades: Record<string, number>;
  oreNodes: OreNode[];
  forge: ForgeState;
  notifications: Notification[];
  lastSaveTime: number;
  totalMined: Record<OreType, number>;
  totalCrafted: number;
  totalSold: number;
  autoMinerActive: boolean;
  selectedItemId: string | null;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  timestamp: number;
}