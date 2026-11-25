function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeForTokens(value) {
  return normalize(value).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function includesText(source, query) {
  return normalize(source).includes(normalize(query));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildSearchText(job) {
  return [
    job?.title,
    job?.description,
    ...(job?.requirements || []),
    job?.location,
    job?.jobType,
  ]
    .filter(Boolean)
    .join(" ");
}

function tokenize(value) {
  return normalizeForTokens(value).split(" ").filter(Boolean);
}

function levenshteinDistance(first = "", second = "") {
  if (first === second) return 0;
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  const current = new Array(second.length + 1).fill(0);

  for (let i = 1; i <= first.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= second.length; j += 1) {
      const substitutionCost = first[i - 1] === second[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
    }
    for (let j = 0; j <= second.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[second.length];
}

function fuzzyTextScore(sourceText, keyword) {
  const sourceTokens = tokenize(sourceText);
  const keywordTokens = tokenize(keyword);
  if (!sourceTokens.length || !keywordTokens.length) return 0;

  const tokenScores = keywordTokens.map((keywordToken) => {
    if (sourceTokens.includes(keywordToken)) return 1;

    let best = 0;
    for (const sourceToken of sourceTokens) {
      const distance = levenshteinDistance(sourceToken, keywordToken);
      const similarity = 1 - distance / Math.max(sourceToken.length, keywordToken.length);
      if (similarity > best) best = similarity;
      if (best >= 1) break;
    }
    return best;
  });

  const total = tokenScores.reduce((sum, value) => sum + value, 0);
  return total / tokenScores.length;
}

export function computeMatchScore(job, context = {}) {
  const keyword = normalize(context.keyword);
  const userSkills = (context.user?.profile?.skills || []).map((item) => normalize(item));
  const jobRequirements = (job?.requirements || []).map((item) => normalize(item));
  const jobText = buildSearchText(job);

  let score = 0;

  if (!keyword) {
    score += 40;
  } else if (includesText(jobText, keyword)) {
    score += 60;
  } else {
    const fuzzyScore = fuzzyTextScore(jobText, keyword);
    if (fuzzyScore >= 0.8) score += 55;
    else if (fuzzyScore >= 0.7) score += 45;
    else if (fuzzyScore >= 0.6) score += 30;
  }

  if (userSkills.length && jobRequirements.length) {
    const overlap = jobRequirements.filter((item) => userSkills.includes(item)).length;
    score += Math.min(overlap * 10, 30);
  }

  const daysOld = Math.floor(
    (Date.now() - new Date(job?.createdAt || Date.now()).getTime()) / (24 * 60 * 60 * 1000)
  );
  if (daysOld <= 7) score += 10;

  return Math.min(score, 100);
}

export function rankJobsByMatch(jobs = [], context = {}) {
  return [...jobs]
    .map((job) => ({
      ...job,
      matchScore: computeMatchScore(job, context),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function filterJobs(jobs = [], filters = {}) {
  const location = normalize(filters.location);
  const jobType = normalize(filters.jobType);
  const minSalary = toNumber(filters.minSalary);

  return jobs.filter((job) => {
    const locationOk = location ? includesText(job?.location, location) : true;
    const typeOk = jobType ? includesText(job?.jobType, jobType) : true;
    const salaryOk = minSalary ? toNumber(job?.salary) >= minSalary : true;
    return locationOk && typeOk && salaryOk;
  });
}

export function extractTopCategories(jobs = [], limit = 8) {
  const counts = new Map();

  jobs.forEach((job) => {
    const title = String(job?.title || "").trim();
    if (!title) return;
    counts.set(title, (counts.get(title) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([title]) => title);
}
