import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const trimString = (value) => String(value ?? "").trim();

export const validateRequiredText = (value, fieldName, minLength = 1, maxLength = 5000) => {
  const text = trimString(value);
  if (!text) {
    return { valid: false, message: `${fieldName} is required`, value: "" };
  }
  if (text.length < minLength) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${minLength} characters`,
      value: text,
    };
  }
  if (text.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} must be at most ${maxLength} characters`,
      value: text,
    };
  }
  return { valid: true, value: text };
};

export const validateOptionalText = (value, fieldName, maxLength = 5000) => {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: "" };
  }
  const text = trimString(value);
  if (text.length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} must be at most ${maxLength} characters`,
      value: text,
    };
  }
  return { valid: true, value: text };
};

export const validateEmail = (value) => {
  const email = trimString(value).toLowerCase();
  if (!email) {
    return { valid: false, message: "Email is required", value: "" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: "Invalid email format", value: email };
  }
  return { valid: true, value: email };
};

export const validatePassword = (value) => {
  const password = String(value ?? "");
  if (!password) {
    return { valid: false, message: "Password is required", value: "" };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters", value: password };
  }
  return { valid: true, value: password };
};

export const validatePhoneNumber = (value) => {
  const raw = trimString(value);
  if (!raw) {
    return { valid: false, message: "Phone number is required", value: "" };
  }
  const normalized = raw.replace(/[^\d]/g, "");
  if (normalized.length < 7 || normalized.length > 15) {
    return {
      valid: false,
      message: "Phone number must be between 7 and 15 digits",
      value: normalized,
    };
  }
  return { valid: true, value: normalized };
};

export const validateObjectId = (value, fieldName = "Id") => {
  const text = trimString(value);
  if (!text || !mongoose.Types.ObjectId.isValid(text)) {
    return { valid: false, message: `Invalid ${fieldName}`, value: text };
  }
  return { valid: true, value: text };
};

export const validateOptionalUrl = (value, fieldName = "URL") => {
  if (value === undefined || value === null || value === "") {
    return { valid: true, value: "" };
  }
  const text = trimString(value);
  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, message: `${fieldName} must start with http or https`, value: text };
    }
  } catch {
    return { valid: false, message: `Invalid ${fieldName}`, value: text };
  }
  return { valid: true, value: text };
};

export const validateInteger = (value, fieldName, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return { valid: false, message: `${fieldName} must be a valid integer`, value: null };
  }
  if (parsed < min || parsed > max) {
    return { valid: false, message: `${fieldName} must be between ${min} and ${max}`, value: parsed };
  }
  return { valid: true, value: parsed };
};

export const parseDateInput = (value) => {
  if (value === undefined) return { isProvided: false, valid: true, value: null };
  if (value === null || value === "") return { isProvided: true, valid: true, value: null };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { isProvided: true, valid: false, value: null };
  }
  return { isProvided: true, valid: true, value: parsed };
};

export const validateFutureDate = (value, fieldName = "Date") => {
  const parsed = parseDateInput(value);
  if (!parsed.valid) {
    return { valid: false, message: `Invalid ${fieldName}`, isProvided: parsed.isProvided, value: null };
  }
  if (!parsed.isProvided || parsed.value === null) {
    return { valid: true, isProvided: parsed.isProvided, value: null };
  }
  const gracePeriodMs = 60 * 1000;
  if (parsed.value.getTime() < Date.now() - gracePeriodMs) {
    return { valid: false, message: `${fieldName} must be in the future`, isProvided: true, value: parsed.value };
  }
  return { valid: true, isProvided: true, value: parsed.value };
};

export const parseRequirements = (requirements) => {
  if (Array.isArray(requirements)) {
    const cleaned = requirements.map((item) => trimString(item)).filter(Boolean);
    return cleaned;
  }

  const value = trimString(requirements);
  if (!value) return [];
  return value
    .split(",")
    .map((item) => trimString(item))
    .filter(Boolean);
};
