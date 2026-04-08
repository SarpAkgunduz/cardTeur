// GK-specific fields that should be skipped for non-GK players during validation
const GK_ONLY_FIELDS = ['diving', 'handling', 'kicking', 'reflexes', 'gkPositioning', 'gkSpeed', 'gkOverall'];

function isEmpty(value: unknown): boolean {
  return value === '' || value === null || value === undefined;
}

/**
 * Validates a player form payload before submitting to the backend.
 * Returns an error message string if validation fails, or null if everything is valid.
 */
export function validatePlayer(
  player: Record<string, unknown>,
  isGK: boolean,
  rawJerseyNumber: number | string,
  rawMarketValue: number | string
): string | null {
  // Fields to skip in the "missing" check
  const missing = Object.entries(player)
    .filter(([key, value]) => {
      if (key === 'marketValue') return false;
      if (!isGK && GK_ONLY_FIELDS.includes(key)) return false;
      return isEmpty(value);
    })
    .map(([key]) => key);

  // Check for missing required fields
  if (missing.length > 0) {
    return `Please fill these fields: ${missing.join(', ')}`;
  }

  // Pre-submit validations
  if ((player.name as string).trim() === '') {
    return 'Player Name cannot be empty';
  }
  if (!player.preferredPosition) {
    return 'Please select a Preferred Position';
  }
  if (rawJerseyNumber !== '' && isNaN(Number(rawJerseyNumber))) {
    return 'Jersey Number must be a number (e.g. 10)';
  }
  if (rawMarketValue !== '' && isNaN(Number(rawMarketValue))) {
    return 'Market Value must be a number (e.g. 5000000)';
  }

  return null;
}
