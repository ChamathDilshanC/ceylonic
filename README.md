# ceylonic 🇱🇰

[![CI](https://github.com/ceylonic/ceylonic/actions/workflows/ci.yml/badge.svg)](https://github.com/ceylonic/ceylonic/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/ceylonic.svg)](https://www.npmjs.com/package/ceylonic)
[![npm downloads](https://img.shields.io/npm/dm/ceylonic.svg)](https://www.npmjs.com/package/ceylonic)
[![license](https://img.shields.io/npm/l/ceylonic.svg)](./LICENSE)
[![types](https://img.shields.io/npm/types/ceylonic.svg)](./src)

Zero-dependency TypeScript utilities for Sri Lanka-specific tasks: **NIC**
(National Identity Card) parsing/validation and **Sinhala** date, currency,
and number-to-words formatting.

- ✅ Zero runtime dependencies
- ✅ Strict TypeScript, fully typed
- ✅ Dual ESM + CommonJS builds, tree-shakeable (`sideEffects: false`)
- ✅ Subpath imports (`ceylonic/nic`, `ceylonic/format`)
- ✅ ~100% test coverage, including leap-year and boundary edge cases

## Install

```bash
npm install ceylonic
```

```ts
// Root import
import { parseNIC, formatRupees } from "ceylonic";

// Or subpath imports (smaller bundles, no format code pulled in for NIC-only usage)
import { parseNIC } from "ceylonic/nic";
import { formatRupees } from "ceylonic/format";
```

## Error handling policy

- **Parsing functions never throw for bad input.** `parseNIC` always returns
  a result object with `valid: false` and a human-readable `error` — check
  `result.valid` rather than wrapping calls in `try/catch`.
- **Formatting functions throw for programmer errors.** Wrong argument
  types, invalid `Date`s, or out-of-range numbers throw `TypeError` or
  `RangeError` immediately, since there's no "user input" to gracefully
  degrade — a bad argument here is a bug in the calling code.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the reasoning behind this split.

## NIC utilities

Supports both formats in circulation:

- **Old format**: 9 digits + `V`/`X`, e.g. `"853400070V"`
- **New format**: 12 digits, e.g. `"198534000070"`

### `parseNIC(nic, referenceDate?)`

```ts
import { parseNIC } from "ceylonic/nic";

parseNIC("853400070V");
// {
//   valid: true,
//   format: "old",
//   birthYear: 1985,
//   birthday: Date, // UTC midnight, 1985-12-05
//   birthdayISO: "1985-12-05",
//   gender: "male",
//   age: 40,               // as of today
//   votingEligible: true,  // "V" suffix
//   serial: "0070",
//   formatted: "853400070V",
//   error: null,
// }

// Pin "today" for deterministic age calculation (e.g. in tests)
parseNIC("853400070V", new Date("2030-01-01")).age; // 44

// Invalid input never throws — check `valid`/`error` instead
parseNIC("not-a-nic");
// { valid: false, error: "Invalid NIC format. ...", ... all other fields null }
```

### `isValidNIC(nic)`

```ts
import { isValidNIC } from "ceylonic/nic";

isValidNIC("200015600125"); // true
isValidNIC("850600070V"); // false — Feb 29 in 1985, a non-leap year
```

### `convertToNewNIC(nic)`

```ts
import { convertToNewNIC } from "ceylonic/nic";

convertToNewNIC("853400070V"); // "198534000070"
convertToNewNIC("198534000070"); // returned unchanged (already new format)
convertToNewNIC("invalid"); // null
```

> **Note:** the digit inserted between the day code and serial when
> converting has no publicly documented checksum meaning — it's a
> structural placeholder, not an authoritative check digit. See
> [ARCHITECTURE.md](./ARCHITECTURE.md#domain-knowledge-nic-encoding) and
> "Why the Feb-29 rule exists" below for the full picture.

### Why the NIC Feb-29 rule exists

Sri Lankan NICs encode a birth date as a **day-of-year code** (1-366 for
males, 501-866 for females — subtract 500 to get the day-of-year). Critically,
the encoding table used to derive that code always treats **February as
having 29 days**, regardless of whether the birth year was an actual leap
year:

```
Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
31  29  31  30  31  30  31  31  30  31  30  31
```

This is a real quirk of the government's original encoding scheme, not a bug
in this library. The practical upshot: day-of-year code **60** always means
"Feb 29" in the NIC table — but if the birth year in the NIC (e.g. 1985) was
**not** an actual leap year, there is no real Feb 29 to map that code to.
`ceylonic` treats that combination as invalid rather than silently
rounding to Mar 1 or Feb 28, because:

1. It's the only combination where the fixed table and the real Gregorian
   calendar disagree — every other day-of-year code maps unambiguously.
2. A NIC with an impossible birth date is a strong signal of a
   typo or fraudulent number, which callers should be able to detect.

```ts
parseNIC("850600070V").valid; // false — 1985 isn't a leap year
parseNIC("040600070V").valid; // true  — 1904 is a leap year, birthdayISO "1904-02-29"
```

## Sinhala formatting

### `formatSinhalaDate(date, options?)`

```ts
import { formatSinhalaDate } from "ceylonic/format";

formatSinhalaDate(new Date(2026, 6, 14));
// "2026 ජූලි 14"

formatSinhalaDate(new Date(2026, 6, 14), { weekday: true, suffix: true });
// "2026 ජූලි 14 වන දින, අඟහරුවාදා"

formatSinhalaDate(new Date(2026, 6, 14), { style: "short" });
// "2026-07-14"
```

| Option    | Type                  | Default  | Description                                      |
| --------- | --------------------- | -------- | ------------------------------------------------ |
| `weekday` | `boolean`             | `false`  | Append the Sinhala weekday name.                 |
| `style`   | `"long"` \| `"short"` | `"long"` | `"short"` produces `YYYY-MM-DD`.                 |
| `suffix`  | `boolean`             | `false`  | Append the `"වන දින"` ("on the ... day") suffix. |

### `formatSinhalaRelative(date, now?)`

```ts
import { formatSinhalaRelative } from "ceylonic/format";

formatSinhalaRelative(threeHoursAgo); // "පැය 3කට පෙර"
formatSinhalaRelative(inTwoDays); // "දින 2කින්"
```

Uses fixed-width buckets (minute/hour/day/month≈30d/year≈365d) — see
[ARCHITECTURE.md](./ARCHITECTURE.md#design-decisions--tradeoffs) for why.

### `formatRupees(amount, options?)`

```ts
import { formatRupees } from "ceylonic/format";

formatRupees(1_575_000.5); // "රු. 1,575,000.50"
formatRupees(1_575_000.5, { grouping: "lakh" }); // "රු. 15,75,000.50"
formatRupees(2500, { decimals: 0, symbol: "LKR" }); // "LKR 2,500"
formatRupees(-45.25); // "-රු. 45.25"
```

| Option     | Type                     | Default      | Description                                                        |
| ---------- | ------------------------ | ------------ | ------------------------------------------------------------------ |
| `decimals` | `number`                 | `2`          | Decimal places. Must be a non-negative integer.                    |
| `symbol`   | `string`                 | `"රු."`      | Currency prefix.                                                   |
| `grouping` | `"standard"` \| `"lakh"` | `"standard"` | `"lakh"` groups as 2s after the last 3 digits (South Asian style). |

### `numberToSinhalaWords(n)`

```ts
import { numberToSinhalaWords } from "ceylonic/format";

numberToSinhalaWords(1985); // "එක්දහස් නවයසිය අසූපහ"
numberToSinhalaWords(150); // "එකසිය පනහ"
```

Supports integers `0` to `999,999,999`; throws `RangeError` outside that
range or for non-integers.

### Constants

```ts
import { SINHALA_MONTHS, SINHALA_WEEKDAYS } from "ceylonic/format";

SINHALA_MONTHS[0]; // "ජනවාරි"
SINHALA_WEEKDAYS[0]; // "ඉරිදා" (matches Date#getDay(), Sunday-first)
```

## Development

```bash
npm install
npm run verify   # typecheck + lint + test + build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full setup and PR checklist,
and [ARCHITECTURE.md](./ARCHITECTURE.md) for how the codebase is organized
and the domain knowledge behind it.

## License

MIT © Ceylonic Contributors
