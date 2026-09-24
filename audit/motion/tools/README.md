# Motion capture / diff tools

Method is described in `audit/06-motion-audit.md` (deterministic 21-step scroll capture, settle-wait, pinned `Math.random`, CSS loops held at a fixed phase).

```sh
# one-time, from this folder (node_modules here is git-ignored)
npm i --no-save playwright@1.63.0 pixelmatch@7 pngjs
npx playwright install chromium            # only if Chromium is not already installed

# from the repo root, with the dev server running on :5199 (or BASE=<url>)
node audit/motion/tools/capture.js audit/motion/after
node audit/motion/tools/diff.js audit/motion/baseline audit/motion/after [diff-out-dir]
```

Gate: no step above 0.5% differing pixels at either width. Steps 00/01 carry ~0.1% rasterisation noise on the hero glyph edges even between two captures of identical code.
