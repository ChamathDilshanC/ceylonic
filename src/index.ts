/**
 * Root entry point — re-exports everything from `./nic` and `./format`.
 *
 * Prefer the subpath imports (`ceylonic/nic`, `ceylonic/format`) in
 * size-sensitive contexts; this entry point is a convenience for consumers
 * who want both domains from a single import.
 */
export { parseNIC, isValidNIC, convertToNewNIC } from "./nic";
export type { NICResult } from "./nic";

export {
  formatSinhalaDate,
  formatSinhalaRelative,
  formatRupees,
  numberToSinhalaWords,
  SINHALA_MONTHS,
  SINHALA_WEEKDAYS,
} from "./format";
export type { SinhalaDateOptions, CurrencyOptions } from "./format";

export { parsePhoneNumber, isValidPhoneNumber } from "./phone";
export type { PhoneResult } from "./phone";

export { parseVehicleNumber, isValidVehicleNumber } from "./vehicle";
export type { VehicleResult } from "./vehicle";
