/**
 * Sri Lankan NIC (National Identity Card) parsing and validation.
 *
 * Supports both NIC formats in circulation:
 *  - Old format: 9 digits + `V`/`X`, e.g. `"853400070V"`.
 *  - New format: 12 digits, e.g. `"198534000070"`.
 *
 * See {@link https://github.com/ceylonic/ceylonic/blob/main/ARCHITECTURE.md | ARCHITECTURE.md}
 * for the full encoding scheme (day-of-year table, gender offset, the fixed
 * Feb-29 rule, and the new-format serial/marker-digit layout).
 *
 * Error handling policy: functions in this module never throw for malformed
 * NIC *input* — {@link parseNIC} always returns a result object with
 * `valid: false` and a human-readable `error`. The only exception is the
 * optional `referenceDate` parameter, which is caller configuration rather
 * than data to parse; passing an invalid `Date` there is a programmer error
 * and throws a `TypeError`.
 */

/** Structured result of {@link parseNIC}. */
export interface NICResult {
  /** Whether the input was a syntactically and semantically valid NIC. */
  valid: boolean;
  /** The normalized (trimmed, uppercased) input, or `null` if invalid. */
  formatted: string | null;
  /** Which NIC format matched, or `null` if invalid. */
  format: "old" | "new" | null;
  /** Four-digit birth year, or `null` if invalid. */
  birthYear: number | null;
  /** Birthday as a UTC `Date`, or `null` if invalid. */
  birthday: Date | null;
  /** Birthday as an ISO `YYYY-MM-DD` string, or `null` if invalid. */
  birthdayISO: string | null;
  /** Gender derived from the day-of-year code, or `null` if invalid. */
  gender: "male" | "female" | null;
  /** Age in whole years as of `referenceDate` (defaults to now), or `null` if invalid. */
  age: number | null;
  /**
   * Old format only: `true` for the `V` suffix (voting-eligible), `false` for
   * `X`. Always `null` for new-format NICs, which carry no such marker.
   */
  votingEligible: boolean | null;
  /**
   * The 4-digit serial number, consistent between old and new formats for
   * the same registrant (see {@link convertToNewNIC} for why).
   */
  serial: string | null;
  /** Human-readable reason parsing failed, or `null` if valid. */
  error: string | null;
}

// The NIC day-of-year encoding always assumes February has 29 days,
// regardless of whether the birth year is an actual leap year.
const NIC_MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function invalid(error: string): NICResult {
  return {
    valid: false,
    formatted: null,
    format: null,
    birthYear: null,
    birthday: null,
    birthdayISO: null,
    gender: null,
    age: null,
    votingEligible: null,
    serial: null,
    error,
  };
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Resolve a NIC day-of-year code to a calendar month/day using the fixed
 * NIC month table. Returns `null` when the code has no valid calendar
 * meaning for the given year — the only way that happens is day 60
 * (Feb 29) in a year that isn't an actual leap year.
 *
 * Callers must only pass `dayOfYear` in `[1, 366]` — parseNIC guarantees
 * this by construction (male codes are already 1-366, female codes have
 * 500 subtracted before reaching here), so this function has no separate
 * out-of-range guard.
 */
function dayOfYearToDate(year: number, dayOfYear: number): { month: number; day: number } | null {
  let remaining = dayOfYear;
  for (let m = 0; m < 12; m++) {
    const daysInMonth = NIC_MONTH_DAYS[m] as number;
    if (remaining <= daysInMonth) {
      if (m === 1 && remaining === 29 && !isLeapYear(year)) return null;
      return { month: m + 1, day: remaining };
    }
    remaining -= daysInMonth;
  }
  /* v8 ignore next 2 -- unreachable: NIC_MONTH_DAYS sums to 366 and dayOfYear <= 366 is checked above */
  return null;
}

function calcAge(birthday: Date, referenceDate: Date): number {
  let age = referenceDate.getFullYear() - birthday.getFullYear();
  const m = referenceDate.getMonth() - birthday.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < birthday.getDate())) age--;
  return age;
}

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Parse a Sri Lankan NIC number, accepting both the old (9 digits + `V`/`X`)
 * and new (12 digits) formats. Input is normalized (trimmed, uppercased,
 * internal whitespace stripped) before matching, so `" 853400070v "` parses
 * the same as `"853400070V"`.
 *
 * Never throws for malformed `nic` input — check `result.valid` and
 * `result.error` instead.
 *
 * @param nic - The NIC string to parse.
 * @param referenceDate - The date to compute `age` (and, for new-format
 *   NICs, the "not born in the future" check) against. Defaults to `now`.
 *   Passing an invalid `Date` here throws `TypeError`, since it's caller
 *   configuration, not data being parsed.
 *
 * @example
 * ```ts
 * parseNIC("853400070V");
 * // { valid: true, format: "old", birthYear: 1985, birthdayISO: "1985-12-05", ... }
 * ```
 */
export function parseNIC(nic: string, referenceDate?: Date): NICResult {
  if (referenceDate !== undefined && !isValidDate(referenceDate)) {
    throw new TypeError("parseNIC: referenceDate must be a valid Date");
  }
  const now = referenceDate ?? new Date();

  if (typeof nic !== "string") return invalid("NIC must be a string");
  const cleaned = nic.trim().toUpperCase().replace(/\s+/g, "");

  const oldMatch = /^(\d{9})([VX])$/.exec(cleaned);
  const newMatch = /^(\d{12})$/.exec(cleaned);

  let year: number;
  let dayCode: number;
  let serial: string;
  let format: "old" | "new";
  let votingEligible: boolean | null = null;

  if (oldMatch) {
    format = "old";
    const digits = oldMatch[1] as string;
    // Old NICs were only ever issued to people born in the 1900s.
    const yy = parseInt(digits.slice(0, 2), 10);
    year = 1900 + yy;
    dayCode = parseInt(digits.slice(2, 5), 10);
    serial = digits.slice(5, 9);
    votingEligible = oldMatch[2] === "V";
  } else if (newMatch) {
    format = "new";
    const digits = newMatch[1] as string;
    year = parseInt(digits.slice(0, 4), 10);
    dayCode = parseInt(digits.slice(4, 7), 10);
    // Digit 8 (index 7) is a structural marker introduced when the 2-digit
    // year + V/X suffix was expanded into a 4-digit year (see
    // convertToNewNIC and ARCHITECTURE.md). The true serial is the last 4
    // digits, matching the old format's serial for the same registrant.
    serial = digits.slice(8, 12);
    if (year < 1900 || year > now.getFullYear()) {
      return invalid(`Invalid birth year: ${year}`);
    }
  } else {
    return invalid("Invalid NIC format. Expected 9 digits + V/X (old) or 12 digits (new).");
  }

  let gender: "male" | "female";
  let dayOfYear: number;
  if (dayCode >= 1 && dayCode <= 366) {
    gender = "male";
    dayOfYear = dayCode;
  } else if (dayCode >= 501 && dayCode <= 866) {
    gender = "female";
    dayOfYear = dayCode - 500;
  } else {
    return invalid(`Invalid day-of-year code: ${dayCode}`);
  }

  const md = dayOfYearToDate(year, dayOfYear);
  if (!md) return invalid(`Day-of-year ${dayOfYear} is not valid for year ${year}`);

  const birthday = new Date(Date.UTC(year, md.month - 1, md.day));
  const iso = `${year.toString().padStart(4, "0")}-${md.month
    .toString()
    .padStart(2, "0")}-${md.day.toString().padStart(2, "0")}`;

  return {
    valid: true,
    formatted: cleaned,
    format,
    birthYear: year,
    birthday,
    birthdayISO: iso,
    gender,
    age: calcAge(birthday, now),
    votingEligible,
    serial,
    error: null,
  };
}

/**
 * Quick boolean validity check, equivalent to `parseNIC(nic).valid`.
 *
 * @example
 * ```ts
 * isValidNIC("200015600125"); // true
 * isValidNIC("850600070V");   // false — Feb 29 in a non-leap year
 * ```
 */
export function isValidNIC(nic: string): boolean {
  return parseNIC(nic).valid;
}

/**
 * Convert an old-format NIC (9 digits + `V`/`X`) to the new 12-digit format.
 * New-format input is returned unchanged. Returns `null` for invalid input.
 *
 * The conversion expands the 2-digit year to 4 digits and inserts a single
 * `"0"` marker digit immediately before the original 4-digit serial, per the
 * scheme the Sri Lankan government used when reissuing new-format cards.
 * That marker digit is **not** a validated checksum — there is no publicly
 * documented checksum algorithm for new-format NICs, so this is a
 * structural conversion, not a cryptographic or officially-authoritative
 * one. Do not rely on the output for anything beyond display/lookup
 * purposes; obtain authoritative new NICs from the Department for
 * Registration of Persons.
 *
 * @example
 * ```ts
 * convertToNewNIC("853400070V"); // "198534000070"
 * ```
 */
export function convertToNewNIC(nic: string): string | null {
  const r = parseNIC(nic);
  if (!r.valid || !r.formatted) return null;
  if (r.format === "new") return r.formatted;
  const digits = r.formatted.slice(0, 9);
  const dayCode = digits.slice(2, 5);
  const serial = digits.slice(5, 9);
  return `${r.birthYear}${dayCode}0${serial}`;
}
