# Tests

Craving Holdout V1 uses manual validation scenarios run on a physical iPhone.
No automated test suite in Phase 1.

## Phase 1 Sign-Off

All testing is done against [validation-scenarios.md](validation-scenarios.md).
17 scenarios must all pass on a physical iPhone before Phase 2 begins.

Run using an EAS adhoc build:
```bash
eas build --platform ios --profile adhoc
```
