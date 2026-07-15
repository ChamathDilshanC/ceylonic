/**
 * Run with: npx tsx examples/vehicle.ts
 * (or: node --experimental-strip-types examples/vehicle.ts)
 */
import { isValidVehicleNumber, parseVehicleNumber } from "../src/vehicle.ts";

console.log("Parsing a few input styles:");
console.log(parseVehicleNumber("CAB-1234"));
console.log(parseVehicleNumber("cab 1234"));
console.log(parseVehicleNumber("KV1234"));

console.log("\nisValidVehicleNumber checks:");
console.log("CAB-1234 ->", isValidVehicleNumber("CAB-1234")); // true
console.log("N-123    ->", isValidVehicleNumber("N-123")); // false: legacy format, out of scope
