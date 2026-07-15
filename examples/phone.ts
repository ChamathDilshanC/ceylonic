/**
 * Run with: npx tsx examples/phone.ts
 * (or: node --experimental-strip-types examples/phone.ts)
 */
import { isValidPhoneNumber, parsePhoneNumber } from "../src/phone.ts";

console.log("Mobile number, several input styles:");
console.log(parsePhoneNumber("0771234567"));
console.log(parsePhoneNumber("+94 77 123 4567"));
console.log(parsePhoneNumber("94771234567"));

console.log("\nFixed-line number:");
console.log(parsePhoneNumber("011-2345678"));

console.log("\nisValidPhoneNumber checks:");
console.log("0771234567 ->", isValidPhoneNumber("0771234567")); // true
console.log("123        ->", isValidPhoneNumber("123")); // false
