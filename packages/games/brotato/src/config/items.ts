import type { ItemConfig } from '../types';

export const ITEMS: ItemConfig[] = [
  {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Increases max HP by 20',
    icon: '/assets/ui/health_potion.png',
    tier: 1,
    effects: [
      { stat: 'maxHp', value: 20, type: 'add' },
    ],
  },
  {
    id: 'speed_boots',
    name: 'Speed Boots',
    description: 'Increases movement speed by 0.5',
    icon: '/assets/ui/speed_boots.png',
    tier: 1,
    effects: [
      { stat: 'speed', value: 0.5, type: 'add' },
    ],
  },
  {
    id: 'damage_ring',
    name: 'Damage Ring',
    description: 'Increases damage by 5',
    icon: '/assets/ui/damage_ring.png',
    tier: 1,
    effects: [
      { stat: 'damage', value: 5, type: 'add' },
    ],
  },
  {
    id: 'critical_amulet',
    name: 'Critical Amulet',
    description: 'Increases critical chance by 10%',
    icon: '/assets/ui/crit_amulet.png',
    tier: 2,
    effects: [
      { stat: 'critChance', value: 0.1, type: 'add' },
    ],
  },
  {
    id: 'attack_speed_gloves',
    name: 'Attack Speed Gloves',
    description: 'Increases attack speed by 20%',
    icon: '/assets/ui/as_gloves.png',
    tier: 2,
    effects: [
      { stat: 'attackSpeed', value: 0.2, type: 'multiply' },
    ],
  },
  {
    id: 'armor_plate',
    name: 'Armor Plate',
    description: 'Increases armor by 3',
    icon: '/assets/ui/armor.png',
    tier: 2,
    effects: [
      { stat: 'armor', value: 3, type: 'add' },
    ],
  },
  {
    id: 'dodge_boots',
    name: 'Dodge Boots',
    description: 'Increases dodge chance by 10%',
    icon: '/assets/ui/dodge.png',
    tier: 2,
    effects: [
      { stat: 'dodge', value: 0.1, type: 'add' },
    ],
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: 'Increases luck by 5',
    icon: '/assets/ui/luck.png',
    tier: 2,
    effects: [
      { stat: 'luck', value: 5, type: 'add' },
    ],
  },
  {
    id: 'range_scope',
    name: 'Range Scope',
    description: 'Increases weapon range by 2',
    icon: '/assets/ui/range.png',
    tier: 2,
    effects: [
      { stat: 'range', value: 2, type: 'add' },
    ],
  },
  {
    id: 'piercing_arrow',
    name: 'Piercing Arrow',
    description: 'Increases projectile piercing by 1',
    icon: '/assets/ui/piercing.png',
    tier: 3,
    effects: [
      { stat: 'piercing', value: 1, type: 'add' },
    ],
  },
  {
    id: 'lifesteal_ring',
    name: 'Lifesteal Ring',
    description: 'Gain 10% lifesteal',
    icon: '/assets/ui/lifesteal.png',
    tier: 3,
    effects: [
      { stat: 'lifesteal', value: 0.1, type: 'add' },
    ],
  },
  {
    id: 'regeneration_amulet',
    name: 'Regeneration Amulet',
    description: 'Regenerate 1 HP per second',
    icon: '/assets/ui/regen.png',
    tier: 3,
    effects: [
      { stat: 'regen', value: 1, type: 'add' },
    ],
  },
];
