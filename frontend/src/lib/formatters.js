export function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Not disclosed";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const DEFAULT_POSTING_DURATION_DAYS = 30;

const parsePostingDurationDays = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_POSTING_DURATION_DAYS;
  return Math.floor(parsed);
};

export function getPostingEndDate(createdAt, postingDurationDays = DEFAULT_POSTING_DURATION_DAYS) {
  if (!createdAt) return null;
  const parsedCreatedAt = new Date(createdAt);
  if (Number.isNaN(parsedCreatedAt.getTime())) return null;

  const endDate = new Date(parsedCreatedAt);
  endDate.setDate(endDate.getDate() + parsePostingDurationDays(postingDurationDays));
  return endDate;
}

export function formatPostingEndDate(createdAt, postingDurationDays = DEFAULT_POSTING_DURATION_DAYS) {
  const endDate = getPostingEndDate(createdAt, postingDurationDays);
  return endDate ? formatDate(endDate) : "N/A";
}

export function isPostingClosed(createdAt, postingDurationDays = DEFAULT_POSTING_DURATION_DAYS) {
  const endDate = getPostingEndDate(createdAt, postingDurationDays);
  if (!endDate) return false;
  return Date.now() > endDate.getTime();
}

export function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not scheduled";
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name = "") {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "U";
}
