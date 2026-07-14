import { describe, expect, it } from "vitest";
import { convertToNewNIC, isValidNIC, parseNIC } from "../src/nic";

/** Build an old-format NIC string from parts, e.g. oldNIC("85", 340, "0070", "V"). */
function oldNIC(yy: string, day: number, serial = "0001", letter: "V" | "X" = "V"): string {
  return `${yy}${day.toString().padStart(3, "0")}${serial}${letter}`;
}

/** Build a new-format NIC string, e.g. newNIC(2000, 60, "0001"). */
function newNIC(year: number, day: number, serial = "0001", marker = "0"): string {
  return `${year}${day.toString().padStart(3, "0")}${marker}${serial}`;
}

describe("parseNIC — old format", () => {
  it("parses a male NIC", () => {
    const r = parseNIC("853400070V");
    expect(r.valid).toBe(true);
    expect(r.format).toBe("old");
    expect(r.gender).toBe("male");
    expect(r.birthYear).toBe(1985);
    expect(r.birthdayISO).toBe("1985-12-05");
    expect(r.serial).toBe("0070");
    expect(r.votingEligible).toBe(true);
    expect(r.error).toBeNull();
  });

  it("parses a female NIC (day code offset by 500)", () => {
    const r = parseNIC("858400070V");
    expect(r.valid).toBe(true);
    expect(r.gender).toBe("female");
    expect(r.birthdayISO).toBe("1985-12-05");
  });

  it("marks X suffix as not voting-eligible", () => {
    const r = parseNIC(oldNIC("90", 15, "1234", "X"));
    expect(r.valid).toBe(true);
    expect(r.votingEligible).toBe(false);
  });

  it("normalizes whitespace and lowercase input", () => {
    const a = parseNIC("853400070V");
    const b = parseNIC("  853400070v  ");
    const c = parseNIC("8534 00070 V");
    expect(b.valid).toBe(true);
    expect(b).toEqual(a);
    expect(c.valid).toBe(true);
    expect(c.formatted).toBe("853400070V");
  });

  it("rejects invalid characters", () => {
    expect(parseNIC("85340007OV").valid).toBe(false); // letter O, not zero
    expect(parseNIC("85-400070V").valid).toBe(false);
  });

  it("rejects wrong lengths and missing suffix", () => {
    expect(parseNIC("123").valid).toBe(false);
    expect(parseNIC("853400070").valid).toBe(false); // missing V/X
    expect(parseNIC("8534000700V").valid).toBe(false); // one digit too many
  });

  it("rejects non-string input without throwing", () => {
    // @ts-expect-error deliberate wrong type to verify runtime guard
    const r = parseNIC(853400070);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/string/i);
  });
});

describe("parseNIC — new format", () => {
  it("parses a male NIC", () => {
    const r = parseNIC("200015600125");
    expect(r.valid).toBe(true);
    expect(r.format).toBe("new");
    expect(r.birthYear).toBe(2000);
    expect(r.gender).toBe("male");
    expect(r.birthdayISO).toBe("2000-06-04");
  });

  it("derives a serial consistent with the old-format equivalent", () => {
    const converted = convertToNewNIC("853400070V");
    const r = parseNIC(converted as string);
    expect(r.serial).toBe("0070");
  });

  it("rejects a birth year after referenceDate", () => {
    const nic = newNIC(2030, 100);
    expect(parseNIC(nic, new Date(2026, 0, 1)).valid).toBe(false);
  });

  it("accepts a birth year that is only in the future relative to real time, not referenceDate", () => {
    // Proves the year bound uses referenceDate consistently, not the real current date.
    const nic = newNIC(2030, 100);
    const r = parseNIC(nic, new Date(2031, 0, 1));
    expect(r.valid).toBe(true);
    expect(r.birthYear).toBe(2030);
  });

  it("throws TypeError for an invalid referenceDate", () => {
    expect(() => parseNIC("853400070V", new Date("not a date"))).toThrow(TypeError);
  });
});

describe("NIC day-of-year boundaries", () => {
  it.each([
    [0, false],
    [1, true],
    [366, true],
    [367, false],
    [500, false],
    [501, true],
    [866, true],
    [867, false],
  ])("day code %i -> valid=%s", (day, expected) => {
    expect(parseNIC(oldNIC("85", day)).valid).toBe(expected);
  });

  it("day 1 resolves to Jan 1 and day 366 resolves to Dec 31", () => {
    expect(parseNIC(oldNIC("85", 1)).birthdayISO).toBe("1985-01-01");
    expect(parseNIC(oldNIC("85", 366)).birthdayISO).toBe("1985-12-31");
  });

  it("day 501 (female) resolves to Jan 1 and day 866 to Dec 31", () => {
    expect(parseNIC(oldNIC("85", 501)).birthdayISO).toBe("1985-01-01");
    expect(parseNIC(oldNIC("85", 866)).birthdayISO).toBe("1985-12-31");
  });
});

describe("the fixed Feb-29 rule", () => {
  it("accepts day 60 (Feb 29) in a real leap year", () => {
    const r = parseNIC(oldNIC("04", 60)); // 1904 is a leap year
    expect(r.valid).toBe(true);
    expect(r.birthdayISO).toBe("1904-02-29");
  });

  it("rejects day 60 (Feb 29) in a non-leap year", () => {
    const r = parseNIC(oldNIC("85", 60)); // 1985 is not a leap year
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not valid/i);
  });

  it("rejects day 60 in a century year that is divisible by 4 but not a leap year", () => {
    const r = parseNIC(oldNIC("00", 60)); // 1900 is not a leap year
    expect(r.valid).toBe(false);
  });

  it("accepts day 60 in a leap century year (divisible by 400)", () => {
    const r = parseNIC(newNIC(2000, 60)); // 2000 is a leap year
    expect(r.valid).toBe(true);
    expect(r.birthdayISO).toBe("2000-02-29");
  });

  it("applies the same rule to female day codes (560 = Feb 29)", () => {
    expect(parseNIC(newNIC(2000, 560)).valid).toBe(true);
    expect(parseNIC(newNIC(2000, 560)).birthdayISO).toBe("2000-02-29");
    expect(parseNIC(oldNIC("85", 560)).valid).toBe(false);
  });
});

describe("age calculation", () => {
  // 1990-06-15: day-of-year 167 (31+29+31+30+31+15)
  const nic = oldNIC("90", 167);

  it("counts the birthday itself as the age increment", () => {
    expect(parseNIC(nic, new Date(2026, 5, 15)).age).toBe(36);
  });

  it("does not increment age the day before the birthday", () => {
    expect(parseNIC(nic, new Date(2026, 5, 14)).age).toBe(35);
  });

  it("keeps the incremented age for months after the birthday", () => {
    expect(parseNIC(nic, new Date(2026, 6, 14)).age).toBe(36);
  });
});

describe("isValidNIC", () => {
  it("returns a boolean without throwing", () => {
    expect(isValidNIC("853400070V")).toBe(true);
    expect(isValidNIC("123")).toBe(false);
    expect(isValidNIC("859990070V")).toBe(false);
  });
});

describe("convertToNewNIC", () => {
  it("converts an old-format NIC to new format", () => {
    expect(convertToNewNIC("853400070V")).toBe("198534000070");
  });

  it("returns new-format input unchanged", () => {
    expect(convertToNewNIC("198534000070")).toBe("198534000070");
  });

  it("returns null for invalid input", () => {
    expect(convertToNewNIC("not-a-nic")).toBeNull();
  });
});
