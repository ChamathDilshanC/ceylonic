/**
 * Sri Lankan phone number parsing and validation.
 *
 * Covers both mobile and fixed-line (landline) numbers under Sri Lanka's
 * national numbering plan (country code `+94`). Accepts common real-world
 * input variants — leading `0`, `+94`, bare `94`, the `0094` international
 * dialing prefix, with or without spaces/hyphens — and normalizes them into
 * international, local, and E.164 formats.
 *
 * Scope: this validates the *structural shape* of the number (country code,
 * 9-digit national significant number, mobile-vs-fixed classification via
 * the reserved `07x` mobile block) — it does not identify a specific
 * network operator (operator-to-prefix mappings shift with mergers and
 * acquisitions, so baking them in would go stale) and does not recognize
 * special/short-code numbers (e.g. `1919`, `1900`).
 *
 * Error handling policy: functions in this module never throw for
 * malformed phone number *input* — {@link parsePhoneNumber} always returns
 * a result object with `valid: false` and a human-readable `error`,
 * matching `nic.ts`'s policy for other end-user-supplied data.
 */

/** Structured result of {@link parsePhoneNumber}. */
export interface PhoneResult {
  /** Whether the input was a syntactically valid Sri Lankan phone number. */
  valid: boolean;
  /** `"mobile"` for the reserved `7x` prefix block, `"fixed"` otherwise, or `null` if invalid. */
  type: "mobile" | "fixed" | null;
  /** Always `"94"` when valid, or `null` if invalid. */
  countryCode: string | null;
  /** The 9-digit national significant number (no leading 0, no country code), or `null` if invalid. */
  nationalNumber: string | null;
  /** The 2-digit mobile or area-code prefix (first 2 digits of the national number), or `null` if invalid. */
  prefix: string | null;
  /** The remaining 7-digit subscriber number, or `null` if invalid. */
  subscriberNumber: string | null;
  /** International format, e.g. `"+94 77 123 4567"`, or `null` if invalid. */
  formatted: string | null;
  /** Local format with trunk prefix, e.g. `"077 123 4567"`, or `null` if invalid. */
  formattedLocal: string | null;
  /** Compact E.164 format, e.g. `"+94771234567"`, or `null` if invalid. */
  e164: string | null;
  /** Human-readable reason parsing failed, or `null` if valid. */
  error: string | null;
}

function invalid(error: string): PhoneResult {
  return {
    valid: false,
    type: null,
    countryCode: null,
    nationalNumber: null,
    prefix: null,
    subscriberNumber: null,
    formatted: null,
    formattedLocal: null,
    e164: null,
    error,
  };
}

/**
 * Parse a Sri Lankan phone number, accepting local (`0771234567`),
 * international (`+94771234567`, `94771234567`), and IDD-prefixed
 * (`0094771234567`) forms, with optional spaces/hyphens anywhere.
 *
 * Never throws for malformed `phone` input — check `result.valid` and
 * `result.error` instead.
 *
 * @param phone - The phone number string to parse.
 *
 * @example
 * ```ts
 * parsePhoneNumber("077 123 4567");
 * // {
 * //   valid: true,
 * //   type: "mobile",
 * //   countryCode: "94",
 * //   nationalNumber: "771234567",
 * //   prefix: "77",
 * //   subscriberNumber: "1234567",
 * //   formatted: "+94 77 123 4567",
 * //   formattedLocal: "077 123 4567",
 * //   e164: "+94771234567",
 * //   error: null,
 * // }
 *
 * parsePhoneNumber("011-2345678").type; // "fixed"
 * parsePhoneNumber("not-a-number").valid; // false
 * ```
 */
export function parsePhoneNumber(phone: string): PhoneResult {
  if (typeof phone !== "string") return invalid("Phone number must be a string");

  const cleaned = phone.trim().replace(/[\s-]+/g, "");
  if (cleaned === "") return invalid("Phone number is empty");

  let digits: string;
  if (cleaned.startsWith("+94")) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith("0094")) {
    digits = cleaned.slice(4);
  } else if (cleaned.startsWith("94") && cleaned.length === 11) {
    digits = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 10) {
    digits = cleaned.slice(1);
  } else if (cleaned.length === 9) {
    digits = cleaned;
  } else {
    return invalid(
      "Invalid phone number format. Expected a 9-digit national number, optionally prefixed with 0, 94, +94, or 0094.",
    );
  }

  if (!/^[1-9]\d{8}$/.test(digits)) {
    return invalid(
      "Invalid phone number: expected exactly 9 digits after the country/trunk prefix",
    );
  }

  const prefix = digits.slice(0, 2);
  const subscriberNumber = digits.slice(2);
  const type: "mobile" | "fixed" = prefix.startsWith("7") ? "mobile" : "fixed";
  const subA = subscriberNumber.slice(0, 3);
  const subB = subscriberNumber.slice(3);

  return {
    valid: true,
    type,
    countryCode: "94",
    nationalNumber: digits,
    prefix,
    subscriberNumber,
    formatted: `+94 ${prefix} ${subA} ${subB}`,
    formattedLocal: `0${prefix} ${subA} ${subB}`,
    e164: `+94${digits}`,
    error: null,
  };
}

/**
 * Quick boolean validity check, equivalent to `parsePhoneNumber(phone).valid`.
 *
 * @example
 * ```ts
 * isValidPhoneNumber("0771234567"); // true
 * isValidPhoneNumber("123");        // false
 * ```
 */
export function isValidPhoneNumber(phone: string): boolean {
  return parsePhoneNumber(phone).valid;
}
