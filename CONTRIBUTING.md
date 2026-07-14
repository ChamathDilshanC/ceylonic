# Contributing to ceylonic

Thanks for considering a contribution! This is a small, focused library —
please read [ARCHITECTURE.md](./ARCHITECTURE.md) first if you're changing
anything beyond a typo or a test.

## Setup

```bash
git clone https://github.com/ChamathDilshanC/ceylonic.git
cd ceylonic
npm install
```

Requires Node 18+.

## Commands

```bash
npm run typecheck       # TypeScript, no emit
npm run lint            # ESLint
npm run format:check    # Prettier check (npm run format to auto-fix)
npm run test            # Vitest
npm run test:coverage   # Vitest with coverage thresholds enforced
npm run build           # tsup -> dist/
npm run verify          # all of the above, in order
```

Run the relevant example script to sanity-check behavior manually:

```bash
node --experimental-strip-types examples/nic.ts
node --experimental-strip-types examples/format.ts
```

## Making a change

1. Open an issue first for anything beyond a small fix, so we can agree on
   the approach — especially for NIC encoding or Sinhala grammar changes,
   where correctness depends on domain knowledge that's easy to get subtly
   wrong.
2. Keep `src/nic.ts` and `src/format.ts` independent — see
   [ARCHITECTURE.md §3](./ARCHITECTURE.md#3-module-boundaries).
3. Add TSDoc to any new exported symbol.
4. Add tests per [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-testing-strategy):
   happy path, boundary values, domain-specific edge cases, error-handling
   policy conformance.
5. Run `npx changeset` and describe your change (patch/minor/major +
   summary). This is required for any user-facing change — CI doesn't
   block on it, but your PR won't produce a release without it.

## PR checklist

- [ ] `npm run verify` passes locally
- [ ] New/changed exports have TSDoc
- [ ] Tests cover the happy path, boundaries, and any new domain-specific
      edge case
- [ ] `README.md` updated if the public API changed
- [ ] `ARCHITECTURE.md` updated if you changed module boundaries, domain
      encoding logic, or design tradeoffs
- [ ] `npx changeset` run and the generated file committed

## Code style

Formatting and most style rules are automated (Prettier + ESLint) — don't
hand-wrap or hand-format, just run `npm run format` and `npm run lint:fix`.
Beyond that: no added runtime dependencies, no comments explaining _what_
code does (only _why_, when it's non-obvious), no speculative
abstractions for features that don't exist yet.
