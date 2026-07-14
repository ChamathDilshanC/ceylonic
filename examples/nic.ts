/**
 * Run with: npx tsx examples/nic.ts
 * (or: node --experimental-strip-types examples/nic.ts)
 */
import { convertToNewNIC, isValidNIC, parseNIC } from "../src/nic.ts";

const oldNic = "853400070V";
console.log(`parseNIC(${JSON.stringify(oldNic)})`);
console.log(parseNIC(oldNic));

console.log("\nisValidNIC checks:");
console.log("200015600125 ->", isValidNIC("200015600125")); // true
console.log("850600070V   ->", isValidNIC("850600070V")); // false: Feb 29, non-leap 1985

console.log("\nconvertToNewNIC:");
console.log(oldNic, "->", convertToNewNIC(oldNic));

console.log("\nDeterministic age with a pinned referenceDate:");
console.log(parseNIC(oldNic, new Date("2030-01-01")).age);
