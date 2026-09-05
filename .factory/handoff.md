# Gesture Replay Kit — verification 3 handoff

## Release status

**FAIL — 3 findings, including one privacy boundary defect, and 7 untested or
incompletely tested public claims.**

- Implementation reviewed: `d10ecb6de53d58928559ea347a481b4069b566c3`
- Documentation reviewed: `4aea9aec7b51f829764ac646da819a13b6fd5278`
- Live URL: <https://gesture-game-replay.sociobot.in/>
- Full report: `.factory/verification-3.md`

The live deployment matches the implementation candidate byte-for-byte for the
root, demo shell, service worker, 404, main JS, and main CSS.

## What passed

- Fresh `npm ci`, production audit, all 31 tests, typecheck, build, pack, and
  clean packed-consumer checks.
- Every one of the 16 declared claim commands passed independently.
- Fresh desktop and phone sample flows, demo isolation/reset/exit, scrubbed
  export, malformed-file recovery, delete recovery, invalid-license recovery,
  keyboard controls, reduced motion, 200% text sizing, offline reload, links,
  legal routes, response headers, and designed HTTP 404.
- Factory URL verification and Playwright axe checks passed with no automated
  WCAG A/AA/2.1 AA violations.
- Lighthouse mobile completed: performance 100, accessibility 100, best
  practices 100, SEO 100; LCP 1.36 s, CLS 0, TBT 23 ms.
- Build budgets: JS 25.19 kB (9.42 kB gzip), CSS 17.55 kB (4.65 kB gzip),
  fonts 52.72 kB, hero WebP 41.02 kB.

## Findings to repair

1. **High:** `parseFixture()` permits and round-trips arbitrary fields. The
   live viewer accepted JSON carrying `video`, a name, a device ID, and a face
   descriptor, contrary to the format and privacy copy.
2. **High:** seven public promises are absent from the claims manifest or only
   partly asserted by their tagged test. See the report for the exact list.
3. **Medium:** several phone controls are below the required 44 × 44 px target,
   including demo controls, header links, **Show code**, and the replay range.

## Evidence

Detailed logs, screenshots, browser results, Lighthouse JSON, and privacy/input
probes are under `/work/.evidence/gesture-game-replay-verify-3/`. The required
copies are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.

## Next steps

Strictly allowlist fixture keys or strip unknown values on parse, add complete
tagged coverage for every public claim, enlarge the affected touch targets,
then rebuild, deploy, and independently reverify. Product code was not changed
in this verification work order.
