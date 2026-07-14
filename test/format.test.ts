import { describe, expect, it } from "vitest";
import {
  SINHALA_MONTHS,
  SINHALA_WEEKDAYS,
  formatRupees,
  formatSinhalaDate,
  formatSinhalaRelative,
  numberToSinhalaWords,
} from "../src/format";

describe("SINHALA_MONTHS / SINHALA_WEEKDAYS", () => {
  it("has 12 months and 7 weekdays in calendar order", () => {
    expect(SINHALA_MONTHS).toHaveLength(12);
    expect(SINHALA_MONTHS[0]).toBe("ජනවාරි");
    expect(SINHALA_MONTHS[11]).toBe("දෙසැම්බර්");
    expect(SINHALA_WEEKDAYS).toHaveLength(7);
    expect(SINHALA_WEEKDAYS[0]).toBe("ඉරිදා");
  });
});

describe("formatSinhalaDate", () => {
  const d = new Date(2026, 6, 14); // Tuesday, 14 July 2026

  it("formats the long style by default", () => {
    expect(formatSinhalaDate(d)).toBe("2026 ජූලි 14");
  });

  it("adds the weekday and suffix when requested", () => {
    expect(formatSinhalaDate(d, { weekday: true, suffix: true })).toBe(
      "2026 ජූලි 14 වන දින, අඟහරුවාදා",
    );
  });

  it("formats the short style as ISO-like YYYY-MM-DD", () => {
    expect(formatSinhalaDate(d, { style: "short" })).toBe("2026-07-14");
  });

  it("throws TypeError for a non-Date or invalid Date", () => {
    expect(() => formatSinhalaDate(new Date("nope"))).toThrow(TypeError);
    // @ts-expect-error deliberate wrong type
    expect(() => formatSinhalaDate("2026-07-14")).toThrow(TypeError);
  });
});

describe("formatSinhalaRelative", () => {
  const now = new Date(2026, 6, 14, 12, 0, 0);

  it("handles the sub-minute 'moments' bucket", () => {
    expect(formatSinhalaRelative(new Date(now.getTime() - 30_000), now)).toBe("මොහොතකට පෙර");
    expect(formatSinhalaRelative(new Date(now.getTime() + 30_000), now)).toBe("මොහොතකින්");
  });

  it("handles minutes, hours, days, months and years in the past", () => {
    expect(formatSinhalaRelative(new Date(now.getTime() - 5 * 60_000), now)).toBe(
      "මිනිත්තු 5කට පෙර",
    );
    expect(formatSinhalaRelative(new Date(now.getTime() - 3 * 3_600_000), now)).toBe("පැය 3කට පෙර");
    expect(formatSinhalaRelative(new Date(now.getTime() - 60 * 86_400_000), now)).toBe(
      "මාස 2කට පෙර",
    );
    expect(formatSinhalaRelative(new Date(now.getTime() - 400 * 86_400_000), now)).toBe(
      "අවුරුදු 1කට පෙර",
    );
  });

  it("handles the future tense", () => {
    expect(formatSinhalaRelative(new Date(now.getTime() + 2 * 86_400_000), now)).toBe("දින 2කින්");
  });

  it("defaults `now` to the current time", () => {
    const soon = new Date(Date.now() + 5_000);
    expect(formatSinhalaRelative(soon)).toBe("මොහොතකින්");
  });

  it("throws TypeError for an invalid date or now", () => {
    expect(() => formatSinhalaRelative(new Date("nope"), now)).toThrow(TypeError);
    expect(() => formatSinhalaRelative(now, new Date("nope"))).toThrow(TypeError);
  });
});

describe("formatRupees", () => {
  it("formats with standard grouping and default symbol/decimals", () => {
    expect(formatRupees(1_575_000.5)).toBe("රු. 1,575,000.50");
  });

  it("formats with lakh grouping", () => {
    expect(formatRupees(1_575_000.5, { grouping: "lakh" })).toBe("රු. 15,75,000.50");
  });

  it("leaves amounts under 1000 ungrouped in lakh style", () => {
    expect(formatRupees(999, { grouping: "lakh", decimals: 0 })).toBe("රු. 999");
  });

  it("supports a custom symbol and zero decimals", () => {
    expect(formatRupees(2500, { decimals: 0, symbol: "LKR" })).toBe("LKR 2,500");
  });

  it("rounds when decimals are truncated", () => {
    expect(formatRupees(2500.5, { decimals: 0 })).toBe("රු. 2,501");
  });

  it("formats negative amounts with a leading minus", () => {
    expect(formatRupees(-45.25)).toBe("-රු. 45.25");
  });

  it("formats zero", () => {
    expect(formatRupees(0)).toBe("රු. 0.00");
  });

  it("throws TypeError for a non-finite or non-number amount", () => {
    // @ts-expect-error deliberate wrong type
    expect(() => formatRupees("100")).toThrow(TypeError);
    expect(() => formatRupees(NaN)).toThrow(TypeError);
    expect(() => formatRupees(Infinity)).toThrow(TypeError);
  });

  it("throws TypeError for a non-string symbol", () => {
    // @ts-expect-error deliberate wrong type
    expect(() => formatRupees(100, { symbol: 123 })).toThrow(TypeError);
  });

  it("throws RangeError for negative or non-integer decimals", () => {
    expect(() => formatRupees(100, { decimals: -1 })).toThrow(RangeError);
    expect(() => formatRupees(100, { decimals: 1.5 })).toThrow(RangeError);
  });
});

describe("numberToSinhalaWords", () => {
  it.each([
    [0, "බිංදුව"],
    [1, "එක"],
    [19, "දහනවය"],
    [20, "විස්ස"],
    [21, "විසිඑක"],
    [99, "අනූනවය"],
    [100, "සියය"],
    [101, "එකසිය එක"],
    [500, "පහසියය"],
    [1000, "දහස"],
    [1_000_000, "මිලියනය"],
    [1985, "එක්දහස් නවයසිය අසූපහ"],
    [5000, "පහදහස"],
    [2_500_000, "මිලියන දෙක පහසියයදහස"],
    [999_999_999, "මිලියන නවයසිය අනූනවය නවයසිය අනූනවයදහස් නවයසිය අනූනවය"],
  ])("converts %i -> %s", (n, expected) => {
    expect(numberToSinhalaWords(n)).toBe(expected);
  });

  it("throws RangeError outside 0 - 999,999,999 or for non-integers", () => {
    expect(() => numberToSinhalaWords(-1)).toThrow(RangeError);
    expect(() => numberToSinhalaWords(1_000_000_000)).toThrow(RangeError);
    expect(() => numberToSinhalaWords(1.5)).toThrow(RangeError);
    // @ts-expect-error deliberate wrong type
    expect(() => numberToSinhalaWords("5")).toThrow(RangeError);
  });
});
