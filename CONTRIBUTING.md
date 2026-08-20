# Contributing

## Formatting and Linting

Biome formats the code and checks code quality with one shared configuration.

```text
npm run format       # Format supported files
npm run format:check # Verify formatting without changing files
npm run lint         # Run Biome lint checks
npm run check        # Run formatting and lint checks together
npm run check:write  # Apply formatting and safe lint fixes
```

Use `npm run check` in CI. Do not add a second formatter or duplicate formatting rules in another linter.

## Language Conventions

- Write commit messages in simple English that a high school student can understand.
- Keep commit summaries short and direct.
- Write code comments in English.
- If a comment is not needed, remove it instead of adding extra text.
