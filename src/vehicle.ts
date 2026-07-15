/**
 * Sri Lankan vehicle registration number parsing and validation.
 *
 * Covers the current registration format used since letter-prefix
 * combinations were widened to accommodate more vehicles (2011 onward):
 * 2 or 3 uppercase letters followed by 4 digits, e.g. `CAB-1234`, commonly
 * written with a hyphen or space between the letters and digits.
 *
 * Scope: this module deliberately does NOT attempt to recognize older/
 * legacy plate formats issued before the current scheme (e.g. shorter
 * single-letter or historical province-letter series) — there is no single
 * authoritative public specification for those older formats to validate
 * against, and guessing at one would risk encoding wrong "facts" into a
 * published library. It also makes no claim about geographic or
 * vehicle-class meaning for the letter portion: under the current scheme
 * it is a sequential administrative series, not a documented code (unlike,
 * say, the NIC's day-of-year encoding, which *is* a documented scheme —
 * see {@link https://github.com/ChamathDilshanC/ceylonic/blob/main/ARCHITECTURE.md | ARCHITECTURE.md}).
 *
 * Error handling policy: functions in this module never throw for
 * malformed plate *input* — {@link parseVehicleNumber} always returns a
 * result object with `valid: false` and a human-readable `error`, matching
 * `nic.ts`'s policy for other end-user-supplied data.
 */

/** Structured result of {@link parseVehicleNumber}. */
export interface VehicleResult {
  /** Whether the input matched the current registration format. */
  valid: boolean;
  /** The 2-3 letter prefix, uppercased, or `null` if invalid. */
  letters: string | null;
  /** The 4-digit serial, or `null` if invalid. */
  digits: string | null;
  /** Normalized `"LETTERS-DIGITS"` form, e.g. `"CAB-1234"`, or `null` if invalid. */
  formatted: string | null;
  /** Human-readable reason parsing failed, or `null` if valid. */
  error: string | null;
}

function invalid(error: string): VehicleResult {
  return { valid: false, letters: null, digits: null, formatted: null, error };
}

/**
 * Parse a Sri Lankan vehicle registration number in the current (2-3
 * letters + 4 digits) format. Input is normalized (trimmed, uppercased,
 * hyphens/spaces between the letters and digits stripped) before matching,
 * so `"cab 1234"`, `"CAB-1234"`, and `"CAB1234"` all parse identically.
 *
 * Never throws for malformed `plate` input — check `result.valid` and
 * `result.error` instead.
 *
 * @param plate - The vehicle registration string to parse.
 *
 * @example
 * ```ts
 * parseVehicleNumber("cab-1234");
 * // { valid: true, letters: "CAB", digits: "1234", formatted: "CAB-1234", error: null }
 *
 * parseVehicleNumber("N-123"); // older/legacy formats are out of scope
 * // { valid: false, error: "Invalid vehicle registration format. ...", ...rest: null }
 * ```
 */
export function parseVehicleNumber(plate: string): VehicleResult {
  if (typeof plate !== "string") return invalid("Vehicle number must be a string");

  const cleaned = plate.trim().toUpperCase().replace(/[\s-]+/g, "");
  const match = /^([A-Z]{2,3})(\d{4})$/.exec(cleaned);
  if (!match) {
    return invalid(
      "Invalid vehicle registration format. Expected 2-3 letters followed by 4 digits, e.g. CAB-1234.",
    );
  }

  const letters = match[1] as string;
  const digits = match[2] as string;
  return {
    valid: true,
    letters,
    digits,
    formatted: `${letters}-${digits}`,
    error: null,
  };
}

/**
 * Quick boolean validity check, equivalent to `parseVehicleNumber(plate).valid`.
 *
 * @example
 * ```ts
 * isValidVehicleNumber("CAB-1234"); // true
 * isValidVehicleNumber("N-123");    // false — legacy formats are out of scope
 * ```
 */
export function isValidVehicleNumber(plate: string): boolean {
  return parseVehicleNumber(plate).valid;
}
