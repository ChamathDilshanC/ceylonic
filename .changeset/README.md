# Changesets

This directory manages changelogs and version bumps for `ceylonic` via
[Changesets](https://github.com/changesets/changesets).

When you make a user-facing change, run:

```bash
npx changeset
```

Pick the affected package, choose a semver bump (patch/minor/major), and
write a short summary — this becomes the changelog entry. Commit the
generated `.changeset/*.md` file with your PR.

On merge to `main`, the release workflow opens (or updates) a "Version
Packages" PR that bumps versions and updates `CHANGELOG.md`. Merging that PR
triggers the actual `npm publish`. See `ARCHITECTURE.md` for the full flow.
