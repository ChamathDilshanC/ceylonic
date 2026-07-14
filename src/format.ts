/**
 * Sinhala date, relative-time, currency, and number-to-words formatting.
 *
 * Error handling policy: every function here validates its arguments and
 * throws `TypeError` (wrong type / not a valid `Date`) or `RangeError`
 * (value outside the supported range) for programmer errors. Unlike the
 * `nic` module, there is no "user input" to gracefully reject here — bad
 * arguments are bugs in the calling code, so they throw immediately instead
 * of silently producing garbage output.
 */

/** Sinhala month names, January through December. */
export const SINHALA_MONTHS = [
  "ජනවාරි",
  "පෙබරවාරි",
  "මාර්තු",
  "අප්‍රේල්",
  "මැයි",
  "ජූනි",
  "ජූලි",
  "අගෝස්තු",
  "සැප්තැම්බර්",
  "ඔක්තෝබර්",
  "නොවැම්බර්",
  "දෙසැම්බර්",
] as const;

/** Sinhala weekday names, Sunday through Saturday (matches `Date#getDay`). */
export const SINHALA_WEEKDAYS = [
  "ඉරිදා",
  "සඳුදා",
  "අඟහරුවාදා",
  "බදාදා",
  "බ්‍රහස්පතින්දා",
  "සිකුරාදා",
  "සෙනසුරාදා",
] as const;

/** Options for {@link formatSinhalaDate}. */
export interface SinhalaDateOptions {
  /** Include the weekday name, e.g. `"සඳුදා"`. Default: `false`. */
  weekday?: boolean;
  /** `"long"` -> `"2026 ජූලි 14"`, `"short"` -> `"2026-07-14"`. Default: `"long"`. */
  style?: "long" | "short";
  /** Append the `"වන දින"` suffix, e.g. `"14 වන දින"`. Default: `false`. */
  suffix?: boolean;
}

function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Format a date in Sinhala.
 *
 * @throws {TypeError} If `date` is not a valid `Date`.
 *
 * @example
 * ```ts
 * formatSinhalaDate(new Date(2026, 6, 14));
 * // "2026 ජූලි 14"
 * formatSinhalaDate(new Date(2026, 6, 14), { weekday: true, suffix: true });
 * // "2026 ජූලි 14 වන දින, අඟහරුවාදා"
 * ```
 */
export function formatSinhalaDate(date: Date, options: SinhalaDateOptions = {}): string {
  if (!isValidDate(date)) {
    throw new TypeError("formatSinhalaDate: date must be a valid Date");
  }
  const { weekday = false, style = "long", suffix = false } = options;

  if (style === "short") {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  let out = `${date.getFullYear()} ${SINHALA_MONTHS[date.getMonth()]} ${date.getDate()}`;
  if (suffix) out += " වන දින";
  if (weekday) out += `, ${SINHALA_WEEKDAYS[date.getDay()]}`;
  return out;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

/**
 * Format the difference between `date` and `now` as a Sinhala relative-time
 * string, e.g. `"පැය 3කට පෙර"` (3 hours ago) or `"දින 2කින්"` (in 2 days).
 *
 * Uses fixed-width approximations (30-day months, 365-day years) rather than
 * calendar-aware month/year arithmetic — the same tradeoff most
 * relative-time libraries make, since exact calendar math rarely changes
 * the displayed bucket.
 *
 * @throws {TypeError} If `date` or `now` is not a valid `Date`.
 *
 * @example
 * ```ts
 * formatSinhalaRelative(threeHoursAgo); // "පැය 3කට පෙර"
 * formatSinhalaRelative(inTwoDays);     // "දින 2කින්"
 * ```
 */
export function formatSinhalaRelative(date: Date, now: Date = new Date()): string {
  if (!isValidDate(date)) {
    throw new TypeError("formatSinhalaRelative: date must be a valid Date");
  }
  if (!isValidDate(now)) {
    throw new TypeError("formatSinhalaRelative: now must be a valid Date");
  }

  const diffMs = date.getTime() - now.getTime();
  const past = diffMs < 0;
  const abs = Math.abs(diffMs);

  let value: number;
  let unit: string;
  if (abs < MINUTE_MS) return past ? "මොහොතකට පෙර" : "මොහොතකින්";
  else if (abs < HOUR_MS) {
    value = Math.floor(abs / MINUTE_MS);
    unit = "මිනිත්තු";
  } else if (abs < DAY_MS) {
    value = Math.floor(abs / HOUR_MS);
    unit = "පැය";
  } else if (abs < MONTH_MS) {
    value = Math.floor(abs / DAY_MS);
    unit = "දින";
  } else if (abs < YEAR_MS) {
    value = Math.floor(abs / MONTH_MS);
    unit = "මාස";
  } else {
    value = Math.floor(abs / YEAR_MS);
    unit = "අවුරුදු";
  }

  return past ? `${unit} ${value}කට පෙර` : `${unit} ${value}කින්`;
}

/** Options for {@link formatRupees}. */
export interface CurrencyOptions {
  /** Number of decimal places. Default: `2`. */
  decimals?: number;
  /** Currency symbol/prefix. Default: `"රු."`. */
  symbol?: string;
  /**
   * Digit grouping: `"standard"` (1,500,000) or the South Asian `"lakh"`
   * style (15,00,000 — groups of 2 after the last 3 digits). Default:
   * `"standard"`.
   */
  grouping?: "standard" | "lakh";
}

function groupDigits(intPart: string, grouping: "standard" | "lakh"): string {
  if (grouping === "standard") {
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}

/**
 * Format an amount as Sri Lankan Rupees.
 *
 * @throws {TypeError} If `amount` is not a finite number, or `symbol` is not a string.
 * @throws {RangeError} If `decimals` is not a non-negative integer.
 *
 * @example
 * ```ts
 * formatRupees(1575000.5);                       // "රු. 1,575,000.50"
 * formatRupees(1575000.5, { grouping: "lakh" });  // "රු. 15,75,000.50"
 * formatRupees(2500, { decimals: 0, symbol: "LKR" }); // "LKR 2,500"
 * ```
 */
export function formatRupees(amount: number, options: CurrencyOptions = {}): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("formatRupees: amount must be a finite number");
  }
  const { decimals = 2, symbol = "රු.", grouping = "standard" } = options;
  if (typeof symbol !== "string") {
    throw new TypeError("formatRupees: symbol must be a string");
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError("formatRupees: decimals must be a non-negative integer");
  }

  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const grouped = groupDigits(intPart as string, grouping);
  const num = decPart ? `${grouped}.${decPart}` : grouped;
  return `${negative ? "-" : ""}${symbol} ${num}`;
}

const ONES = [
  "",
  "එක",
  "දෙක",
  "තුන",
  "හතර",
  "පහ",
  "හය",
  "හත",
  "අට",
  "නවය",
  "දහය",
  "එකොළහ",
  "දොළහ",
  "දහතුන",
  "දාහතර",
  "පහළොව",
  "දාසය",
  "දාහත",
  "දහඅට",
  "දහනවය",
];
const TENS = ["", "", "විස්ස", "තිහ", "හතළිහ", "පනහ", "හැට", "හැත්තෑව", "අසූව", "අනූව"];
const TENS_PREFIX = ["", "", "විසි", "තිස්", "හතළිස්", "පනස්", "හැට", "හැත්තෑ", "අසූ", "අනූ"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n] as string;
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? (TENS[t] as string) : `${TENS_PREFIX[t]}${ONES[o]}`;
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (h > 0) {
    if (h === 1) out = rest === 0 ? "සියය" : "එකසිය";
    else out = rest === 0 ? `${ONES[h]}සියය` : `${ONES[h]}සිය`;
  }
  if (rest > 0) out += (out ? " " : "") + belowHundred(rest);
  return out;
}

/**
 * Convert a non-negative integer (0 to 999,999,999) to Sinhala words.
 *
 * @throws {RangeError} If `n` is not an integer in `[0, 999_999_999]`.
 *
 * @example
 * ```ts
 * numberToSinhalaWords(1985); // "එක්දහස් නවයසිය අසූපහ"
 * numberToSinhalaWords(150);  // "එකසිය පනහ"
 * ```
 */
export function numberToSinhalaWords(n: number): string {
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 999_999_999) {
    throw new RangeError("numberToSinhalaWords: supports integers 0 - 999,999,999");
  }
  if (n === 0) return "බිංදුව";

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const parts: string[] = [];
  if (millions > 0) {
    parts.push(millions === 1 ? "මිලියනය" : `මිලියන ${belowThousand(millions)}`);
  }
  if (thousands > 0) {
    if (thousands === 1) parts.push("එක්දහස්");
    else parts.push(`${belowThousand(thousands)}දහස්`);
  }
  if (rest > 0) parts.push(belowThousand(rest));

  if (rest === 0 && thousands > 0) {
    parts[parts.length - 1] = thousands === 1 ? "දහස" : `${belowThousand(thousands)}දහස`;
  }

  return parts.join(" ");
}
