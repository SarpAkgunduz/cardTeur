export interface FormationSlot { x: number; y: number; role: string; }
export interface Formation { name: string; slots: FormationSlot[]; }
export type RoleCat = 'gk' | 'att' | 'def' | 'mid';

export const FORMATIONS: Record<number, Formation[]> = {
  5: [
    {
      name: '1-2-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 50, y: 72, role: 'CB' },
        { x: 25, y: 48, role: 'LM' }, { x: 75, y: 48, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '2-1-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 28, y: 73, role: 'LB' }, { x: 72, y: 73, role: 'RB' },
        { x: 50, y: 48, role: 'CM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '2-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 25, y: 68, role: 'LB' }, { x: 75, y: 68, role: 'RB' },
        { x: 25, y: 22, role: 'LW' }, { x: 75, y: 22, role: 'RW' },
      ],
    },
  ],
  6: [
    {
      name: '2-2-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 28, y: 72, role: 'LB' }, { x: 72, y: 72, role: 'RB' },
        { x: 28, y: 48, role: 'LM' }, { x: 72, y: 48, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '1-2-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 50, y: 72, role: 'CB' },
        { x: 28, y: 50, role: 'LM' }, { x: 72, y: 50, role: 'RM' },
        { x: 28, y: 22, role: 'LW' }, { x: 72, y: 22, role: 'RW' },
      ],
    },
    {
      name: '3-1-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 20, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 80, y: 74, role: 'RB' },
        { x: 50, y: 48, role: 'CM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
  ],
  7: [
    {
      name: '2-3-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 25, y: 73, role: 'LB' }, { x: 75, y: 73, role: 'RB' },
        { x: 14, y: 50, role: 'LM' }, { x: 50, y: 50, role: 'CM' }, { x: 86, y: 50, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '3-2-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 18, y: 73, role: 'LB' }, { x: 50, y: 75, role: 'CB' }, { x: 82, y: 73, role: 'RB' },
        { x: 28, y: 50, role: 'LM' }, { x: 72, y: 50, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '2-2-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 25, y: 73, role: 'LB' }, { x: 75, y: 73, role: 'RB' },
        { x: 25, y: 50, role: 'LM' }, { x: 75, y: 50, role: 'RM' },
        { x: 25, y: 20, role: 'LS' }, { x: 75, y: 20, role: 'RS' },
      ],
    },
  ],
  8: [
    {
      name: '2-3-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 28, y: 73, role: 'LB' }, { x: 72, y: 73, role: 'RB' },
        { x: 17, y: 52, role: 'LM' }, { x: 50, y: 52, role: 'CM' }, { x: 83, y: 52, role: 'RM' },
        { x: 30, y: 22, role: 'LS' }, { x: 70, y: 22, role: 'RS' },
      ],
    },
    {
      name: '3-3-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 20, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 80, y: 74, role: 'RB' },
        { x: 18, y: 51, role: 'LM' }, { x: 50, y: 51, role: 'CM' }, { x: 82, y: 51, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '2-2-3',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 28, y: 73, role: 'LB' }, { x: 72, y: 73, role: 'RB' },
        { x: 30, y: 51, role: 'LM' }, { x: 70, y: 51, role: 'RM' },
        { x: 17, y: 21, role: 'LW' }, { x: 50, y: 18, role: 'ST' }, { x: 83, y: 21, role: 'RW' },
      ],
    },
  ],
  9: [
    {
      name: '3-3-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 18, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 82, y: 74, role: 'RB' },
        { x: 18, y: 51, role: 'LM' }, { x: 50, y: 51, role: 'CM' }, { x: 82, y: 51, role: 'RM' },
        { x: 30, y: 21, role: 'LS' }, { x: 70, y: 21, role: 'RS' },
      ],
    },
    {
      name: '3-4-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 18, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 82, y: 74, role: 'RB' },
        { x: 12, y: 50, role: 'LM' }, { x: 37, y: 50, role: 'LCM' }, { x: 63, y: 50, role: 'RCM' }, { x: 88, y: 50, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
    {
      name: '4-2-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 13, y: 74, role: 'LB' }, { x: 37, y: 75, role: 'LCB' }, { x: 63, y: 75, role: 'RCB' }, { x: 87, y: 74, role: 'RB' },
        { x: 28, y: 51, role: 'LM' }, { x: 72, y: 51, role: 'RM' },
        { x: 28, y: 21, role: 'LS' }, { x: 72, y: 21, role: 'RS' },
      ],
    },
  ],
  10: [
    {
      name: '4-3-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 13, y: 74, role: 'LB' }, { x: 37, y: 75, role: 'LCB' }, { x: 63, y: 75, role: 'RCB' }, { x: 87, y: 74, role: 'RB' },
        { x: 18, y: 51, role: 'LM' }, { x: 50, y: 51, role: 'CM' }, { x: 82, y: 51, role: 'RM' },
        { x: 30, y: 21, role: 'LS' }, { x: 70, y: 21, role: 'RS' },
      ],
    },
    {
      name: '3-4-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 18, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 82, y: 74, role: 'RB' },
        { x: 12, y: 51, role: 'LM' }, { x: 37, y: 51, role: 'LCM' }, { x: 63, y: 51, role: 'RCM' }, { x: 88, y: 51, role: 'RM' },
        { x: 30, y: 21, role: 'LS' }, { x: 70, y: 21, role: 'RS' },
      ],
    },
    {
      name: '4-4-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 13, y: 74, role: 'LB' }, { x: 37, y: 75, role: 'LCB' }, { x: 63, y: 75, role: 'RCB' }, { x: 87, y: 74, role: 'RB' },
        { x: 12, y: 51, role: 'LM' }, { x: 37, y: 51, role: 'LCM' }, { x: 63, y: 51, role: 'RCM' }, { x: 88, y: 51, role: 'RM' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
  ],
  11: [
    {
      name: '4-3-3',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 14, y: 73, role: 'LB' }, { x: 37, y: 75, role: 'CB' }, { x: 63, y: 75, role: 'CB' }, { x: 86, y: 73, role: 'RB' },
        { x: 19, y: 52, role: 'LM' }, { x: 50, y: 52, role: 'CM' }, { x: 81, y: 52, role: 'RM' },
        { x: 16, y: 21, role: 'LW' }, { x: 50, y: 18, role: 'ST' }, { x: 84, y: 21, role: 'RW' },
      ],
    },
    {
      name: '4-4-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 14, y: 73, role: 'LB' }, { x: 37, y: 75, role: 'CB' }, { x: 63, y: 75, role: 'CB' }, { x: 86, y: 73, role: 'RB' },
        { x: 14, y: 51, role: 'LM' }, { x: 37, y: 51, role: 'LCM' }, { x: 63, y: 51, role: 'RCM' }, { x: 86, y: 51, role: 'RM' },
        { x: 33, y: 21, role: 'LS' }, { x: 67, y: 21, role: 'RS' },
      ],
    },
    {
      name: '3-5-2',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 18, y: 74, role: 'LB' }, { x: 50, y: 76, role: 'CB' }, { x: 82, y: 74, role: 'RB' },
        { x: 9, y: 52, role: 'LM' }, { x: 28, y: 51, role: 'LCM' }, { x: 50, y: 51, role: 'CM' }, { x: 72, y: 51, role: 'RCM' }, { x: 91, y: 52, role: 'RM' },
        { x: 33, y: 21, role: 'LS' }, { x: 67, y: 21, role: 'RS' },
      ],
    },
    {
      name: '4-2-3-1',
      slots: [
        { x: 50, y: 88, role: 'GK' },
        { x: 14, y: 73, role: 'LB' }, { x: 37, y: 75, role: 'CB' }, { x: 63, y: 75, role: 'CB' }, { x: 86, y: 73, role: 'RB' },
        { x: 33, y: 62, role: 'CDM' }, { x: 67, y: 62, role: 'CDM' },
        { x: 16, y: 42, role: 'LW' }, { x: 50, y: 40, role: 'CAM' }, { x: 84, y: 42, role: 'RW' },
        { x: 50, y: 18, role: 'ST' },
      ],
    },
  ],
};

export const PLAYER_COUNT_OPTIONS = [
  { label: '5v5',   value: 5  },
  { label: '6v6',   value: 6  },
  { label: '7v7',   value: 7  },
  { label: '8v8',   value: 8  },
  { label: '9v9',   value: 9  },
  { label: '10v10', value: 10 },
  { label: '11v11', value: 11 },
];

export function getFormationSet(count: number): Formation[] {
  return FORMATIONS[count] ?? FORMATIONS[8];
}

export function roleCat(role: string): RoleCat {
  const r = role.toUpperCase();
  if (/GK/.test(r)) return 'gk';
  if (/ST|LS|RS|CF|LF|RF|LW|RW/.test(r)) return 'att';
  if (/LB|RB|CB|LCB|RCB|CDM|SW|LWB|RWB/.test(r)) return 'def';
  return 'mid';
}

export function smartAssign(players: any[], slots: FormationSlot[]): any[] {
  const n = (v: any) => parseFloat(String(v ?? 0)) || 0;
  const score = (p: any, cat: RoleCat): number => {
    if (cat === 'gk')  return n(p.gkOverall);
    if (cat === 'att') return n(p.offensiveOverall);
    if (cat === 'def') return n(p.defensiveOverall);
    return (n(p.offensiveOverall) + n(p.defensiveOverall)) / 2;
  };

  const remaining = players.map((p, i) => ({ p, i }));
  const assigned: (any | null)[] = new Array(slots.length).fill(null);

  for (const cat of ['gk', 'att', 'def', 'mid'] as RoleCat[]) {
    const slotIndices = slots.map((_, i) => i).filter(i => roleCat(slots[i].role) === cat && assigned[i] === null);
    for (const si of slotIndices) {
      if (remaining.length === 0) break;
      remaining.sort((a, b) => score(b.p, cat) - score(a.p, cat));
      assigned[si] = remaining.shift()!.p;
    }
  }

  let ri = 0;
  for (let i = 0; i < assigned.length; i++) {
    if (assigned[i] === null && ri < remaining.length) {
      assigned[i] = remaining[ri++].p;
    }
  }
  return assigned;
}
