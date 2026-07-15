import { describe, expect, it } from "vitest";
import { isValidPhoneNumber, parsePhoneNumber } from "../src/phone";

describe("parsePhoneNumber — accepted input variants (mobile)", () => {
  const expected = {
    valid: true,
    type: "mobile" as const,
    countryCode: "94",
    nationalNumber: "771234567",
    prefix: "77",
    subscriberNumber: "1234567",
    formatted: "+94 77 123 4567",
    formattedLocal: "077 123 4567",
    e164: "+94771234567",
    error: null,
  };

  it.each([
    ["local with trunk 0", "0771234567"],
    ["local with spaces", "077 123 4567"],
    ["local with hyphens", "077-123-4567"],
    ["international with +", "+94771234567"],
    ["international with + and spaces", "+94 77 123 4567"],
    ["bare country code, no +", "94771234567"],
    ["IDD-prefixed", "0094771234567"],
    ["bare 9-digit national number", "771234567"],
    ["padded with surrounding whitespace", "  0771234567  "],
  ])("parses %s (%s)", (_label, input) => {
    expect(parsePhoneNumber(input)).toEqual(expected);
  });
});

describe("parsePhoneNumber — fixed-line numbers", () => {
  it("classifies a non-7x prefix as fixed", () => {
    const r = parsePhoneNumber("0112345678");
    expect(r.valid).toBe(true);
    expect(r.type).toBe("fixed");
    expect(r.prefix).toBe("11");
    expect(r.subscriberNumber).toBe("2345678");
    expect(r.formatted).toBe("+94 11 234 5678");
    expect(r.formattedLocal).toBe("011 234 5678");
    expect(r.e164).toBe("+94112345678");
  });

  it("classifies another area code as fixed", () => {
    expect(parsePhoneNumber("0811234567").type).toBe("fixed");
  });
});

describe("parsePhoneNumber — the reserved 7x mobile block", () => {
  it.each(["70", "71", "72", "73", "74", "75", "76", "77", "78", "79"])(
    "prefix %s is classified as mobile",
    (prefix) => {
      const r = parsePhoneNumber(`0${prefix}1234567`);
      expect(r.valid).toBe(true);
      expect(r.type).toBe("mobile");
      expect(r.prefix).toBe(prefix);
    },
  );
});

describe("parsePhoneNumber — invalid input", () => {
  it("rejects too few digits", () => {
    expect(parsePhoneNumber("12345678").valid).toBe(false);
  });

  it("rejects too many digits", () => {
    expect(parsePhoneNumber("1234567890123").valid).toBe(false);
  });

  it("rejects a national number with an extra leading 0 after the country code", () => {
    // +94 followed by a 10-digit "0771234567" instead of the 9-digit national number
    expect(parsePhoneNumber("+940771234567").valid).toBe(false);
  });

  it("rejects a double leading zero that doesn't match the 0094 IDD prefix", () => {
    expect(parsePhoneNumber("00771234567").valid).toBe(false);
  });

  it("rejects letters and symbols", () => {
    expect(parsePhoneNumber("not-a-number").valid).toBe(false);
    expect(parsePhoneNumber("077abc4567").valid).toBe(false);
  });

  it("rejects an empty or whitespace-only string", () => {
    expect(parsePhoneNumber("").valid).toBe(false);
    expect(parsePhoneNumber("   ").valid).toBe(false);
  });

  it("returns a descriptive error message", () => {
    expect(parsePhoneNumber("123").error).toMatch(/invalid phone number/i);
  });

  it("returns all-null fields alongside valid: false", () => {
    const r = parsePhoneNumber("123");
    expect(r).toEqual({
      valid: false,
      type: null,
      countryCode: null,
      nationalNumber: null,
      prefix: null,
      subscriberNumber: null,
      formatted: null,
      formattedLocal: null,
      e164: null,
      error: r.error,
    });
  });

  it("rejects non-string input without throwing", () => {
    // @ts-expect-error deliberate wrong type to verify runtime guard
    const r = parsePhoneNumber(771234567);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/string/i);
  });
});

describe("isValidPhoneNumber", () => {
  it("returns a boolean without throwing", () => {
    expect(isValidPhoneNumber("0771234567")).toBe(true);
    expect(isValidPhoneNumber("0112345678")).toBe(true);
    expect(isValidPhoneNumber("123")).toBe(false);
  });
});
