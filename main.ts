// Entrypoint for the gta6-cover-art-01 entry (Node 22, standard library only).
//
// The app itself is the static offline site in app/ (app/index.html plus its
// classic script and stylesheet — no build step, no network). This program
// hands it in: it copies app/ and screenshots/ next to this file into the
// output directory and writes /output/dossier.json there, using the vendored
// make.fun dossier library in vendor/makefun-app.ts.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally for a quick try with any static server pointed at app/.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the competition's own (reference/gate.json): only
// text_max_bytes shapes the dossier bytes; the rest refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more
// than 993 files in app/ or 48 MiB of app files in all, or a path under
// app/ over 1000 bytes — app/ counts beside /output's own 1000-entry cap).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
