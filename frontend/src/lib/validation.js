export const trimText = (value) => String(value ?? "").trim();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimText(value).toLowerCase());

export const normalizePhoneNumber = (value) => trimText(value).replace(/[^\d]/g, "");

export const isValidPhoneNumber = (value) => {
  const normalized = normalizePhoneNumber(value);
  return normalized.length >= 7 && normalized.length <= 15;
};

export const isValidUrl = (value) => {
  const text = trimText(value);
  if (!text) return true;
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const toInteger = (value) => Number.parseInt(String(value), 10);

export const isIntegerInRange = (value, min, max) => {
  const parsed = toInteger(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
};

export const parseCommaSeparated = (value) =>
  trimText(value)
    .split(",")
    .map((item) => trimText(item))
    .filter(Boolean);

export const isFutureDateInput = (value) => {
  if (!value) return true;
  const parsed = new Date(value);
  const gracePeriodMs = 60 * 1000;
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() >= Date.now() - gracePeriodMs;
};
