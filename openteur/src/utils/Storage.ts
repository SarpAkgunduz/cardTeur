export function setWithExpiry<T>(key: string, value: T, ttlMs: number): void {
  const now = Date.now();
  localStorage.setItem(
    key,
    JSON.stringify({ value, expiry: now + ttlMs })
  );
}

export function getWithExpiry<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const item = JSON.parse(raw);
    if (typeof item?.expiry !== "number") {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}
