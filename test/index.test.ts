import { describe, expect, it } from "vitest";
import * as root from "../src/index";
import * as nic from "../src/nic";
import * as format from "../src/format";

describe("root entry point", () => {
  it("re-exports everything from the nic and format modules", () => {
    expect(root.parseNIC).toBe(nic.parseNIC);
    expect(root.isValidNIC).toBe(nic.isValidNIC);
    expect(root.convertToNewNIC).toBe(nic.convertToNewNIC);
    expect(root.formatSinhalaDate).toBe(format.formatSinhalaDate);
    expect(root.formatSinhalaRelative).toBe(format.formatSinhalaRelative);
    expect(root.formatRupees).toBe(format.formatRupees);
    expect(root.numberToSinhalaWords).toBe(format.numberToSinhalaWords);
    expect(root.SINHALA_MONTHS).toBe(format.SINHALA_MONTHS);
    expect(root.SINHALA_WEEKDAYS).toBe(format.SINHALA_WEEKDAYS);
  });
});
