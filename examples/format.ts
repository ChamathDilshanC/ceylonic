/**
 * Run with: npx tsx examples/format.ts
 * (or: node --experimental-strip-types examples/format.ts)
 */
import {
  formatRupees,
  formatSinhalaDate,
  formatSinhalaRelative,
  numberToSinhalaWords,
} from "../src/format.ts";

const today = new Date(2026, 6, 14);
console.log(formatSinhalaDate(today));
console.log(formatSinhalaDate(today, { weekday: true, suffix: true }));

const threeHoursAgo = new Date(today.getTime() - 3 * 60 * 60 * 1000);
console.log(formatSinhalaRelative(threeHoursAgo, today));

console.log(formatRupees(1_575_000.5));
console.log(formatRupees(1_575_000.5, { grouping: "lakh" }));

console.log(numberToSinhalaWords(1985));
