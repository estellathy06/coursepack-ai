import crypto from "crypto";

/**
 * Normalizes course codes to be alphanumeric and uppercase.
 * e.g., "Math 135", "math-135", "MATH135" -> "MATH135"
 */
export function normalizeCourseCode(code: string): string {
  if (!code) return "";
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Normalizes study time string or number into numeric hours.
 * e.g., "2 hours", "120 minutes", "2h", 2 -> 2
 */
export function normalizeStudyTime(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 2;
  const str = String(val).toLowerCase().trim();
  if (str.includes("minute") || str.includes("min")) {
    const match = str.match(/\d+/);
    return match ? Math.round(Number(match[0]) / 60) : 2;
  }
  const numMatch = str.match(/\d+/);
  return numMatch ? Number(numMatch[0]) : 2;
}

/**
 * Generates a stable SHA-256 hash from a set of normalized variables.
 * Keys of the input dictionary are sorted to ensure determinism.
 */
export function generateCacheKey(variables: Record<string, any>): string {
  const sortedKeys = Object.keys(variables).sort();
  const sortedObj = sortedKeys.reduce((acc, key) => {
    acc[key] = variables[key];
    return acc;
  }, {} as Record<string, any>);

  return crypto.createHash("sha256").update(JSON.stringify(sortedObj)).digest("hex");
}
