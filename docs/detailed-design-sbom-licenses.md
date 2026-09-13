# Detailed Design: SBOM and License Display

## Status

Ready for implementation

## Goal

Make the packages used by SkillBoard Hunter transparent by generating a software bill of
materials (SBOM) and showing package license information inside the app.

## Scope

### In scope

- Generate a CycloneDX JSON SBOM from the committed `package-lock.json`.
- Include direct and transitive npm packages in the generated SBOM.
- Include package name, version, dependency scope, package URL, and license when available.
- Display the generated package list in a read-only Licenses view.
- Regenerate the SBOM before development and production builds.

### Out of scope

- Full license text bundling.
- Legal approval of license compatibility.
- Vulnerability scanning.
- Runtime package discovery from `node_modules`.

## Decisions

- Use CycloneDX JSON so the output can be consumed by common SBOM tools.
- Use `package-lock.json` as the single source of package versions and license metadata.
- Include only runtime dependencies in the public SBOM. Development tools and their transitive
  packages are not redistributed with the product and are omitted.
- The app reads `/sbom.json`; the build script creates this file before Vite runs.
- Unknown license metadata is displayed as `UNKNOWN` rather than guessed.
- `caniuse-lite` remains available to development tooling when required, but is omitted from the
  public SBOM because it is not a runtime product dependency.

## Data flow

```text
package-lock.json -> scripts/generate-sbom.mjs -> public/sbom.json
                                      -> App fetch -> Licenses view
```

## Acceptance criteria

- `npm run generate:sbom` creates valid CycloneDX JSON.
- `npm run build` regenerates the SBOM before building the app.
- The Licenses view lists package name, version, and license.
- A missing or invalid SBOM shows an understandable empty/error state.
- No package license is inferred when the lockfile does not provide one.

## Test strategy

- Unit-test the SBOM generation script with the repository lockfile through a Node execution check.
- Component-test loading, rendering, and failed loading states for the Licenses view.
- Run format, typecheck, unit tests, and production build.

## Risks

- npm packages may omit license metadata or use non-standard license fields; those entries remain
  `UNKNOWN` and require manual review.
- The generated SBOM changes whenever dependencies change and must be regenerated in CI/builds.