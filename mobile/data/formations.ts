// Row-grouped formations for every squad size the web app supports (5v5
// through 11v11) — derived from web's pitch-coordinate formation data
// (src/data/formations.ts) by grouping each formation's slots into rows by
// their vertical position (GK closest to goal first, attackers last), same
// convention the previous hardcoded 11v11-only formation set used. Kept as
// row groups rather than raw x/y coordinates because mobile's pitch UI is a
// row-based grid, not an absolutely-positioned pitch like web's.
export const PLAYER_COUNT_OPTIONS = [5, 6, 7, 8, 9, 10, 11];

export const FORMATIONS_BY_COUNT: Record<number, Record<string, string[][]>> = {
  5: {
    '1-2-1': [['GK'], ['CB'], ['LM', 'RM'], ['ST']],
    '2-1-1': [['GK'], ['LB', 'RB'], ['CM'], ['ST']],
    '2-2': [['GK'], ['LB', 'RB'], ['LW', 'RW']],
  },
  6: {
    '2-2-1': [['GK'], ['LB', 'RB'], ['LM', 'RM'], ['ST']],
    '1-2-2': [['GK'], ['CB'], ['LM', 'RM'], ['LW', 'RW']],
    '3-1-1': [['GK'], ['LB', 'CB', 'RB'], ['CM'], ['ST']],
  },
  7: {
    '2-3-1': [['GK'], ['LB', 'RB'], ['LM', 'CM', 'RM'], ['ST']],
    '3-2-1': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'RM'], ['ST']],
    '2-2-2': [['GK'], ['LB', 'RB'], ['LM', 'RM'], ['LS', 'RS']],
  },
  8: {
    '2-3-2': [['GK'], ['LB', 'RB'], ['LM', 'CM', 'RM'], ['LS', 'RS']],
    '3-3-1': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'CM', 'RM'], ['ST']],
    '2-2-3': [['GK'], ['LB', 'RB'], ['LM', 'RM'], ['LW', 'ST', 'RW']],
  },
  9: {
    '3-3-2': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'CM', 'RM'], ['LS', 'RS']],
    '3-4-1': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'LCM', 'RCM', 'RM'], ['ST']],
    '4-2-2': [['GK'], ['LB', 'LCB', 'RCB', 'RB'], ['LM', 'RM'], ['LS', 'RS']],
  },
  10: {
    '4-3-2': [['GK'], ['LB', 'LCB', 'RCB', 'RB'], ['LM', 'CM', 'RM'], ['LS', 'RS']],
    '3-4-2': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'LCM', 'RCM', 'RM'], ['LS', 'RS']],
    '4-4-1': [['GK'], ['LB', 'LCB', 'RCB', 'RB'], ['LM', 'LCM', 'RCM', 'RM'], ['ST']],
  },
  11: {
    '4-3-3': [['GK'], ['LB', 'CB', 'CB', 'RB'], ['LM', 'CM', 'RM'], ['LW', 'ST', 'RW']],
    '4-4-2': [['GK'], ['LB', 'CB', 'CB', 'RB'], ['LM', 'LCM', 'RCM', 'RM'], ['LS', 'RS']],
    '3-5-2': [['GK'], ['LB', 'CB', 'RB'], ['LM', 'LCM', 'CM', 'RCM', 'RM'], ['LS', 'RS']],
    '4-2-3-1': [['GK'], ['LB', 'CB', 'CB', 'RB'], ['CDM', 'CDM'], ['LW', 'CAM', 'RW'], ['ST']],
  },
};

export function getFormationNames(count: number): string[] {
  return Object.keys(FORMATIONS_BY_COUNT[count] ?? FORMATIONS_BY_COUNT[11]);
}

export function getFormationRows(count: number, name: string): string[][] {
  const set = FORMATIONS_BY_COUNT[count] ?? FORMATIONS_BY_COUNT[11];
  return set[name] ?? Object.values(set)[0];
}
