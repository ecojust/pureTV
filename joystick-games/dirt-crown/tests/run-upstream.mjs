// Upstream regression subset; bot/simulation checks are not normal player browser evidence.
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,[new URL('./upstream-simtest.mjs',import.meta.url).pathname],{stdio:'inherit',env:{...process.env,ONLY:'purity,tracks,determinism,rules'}});
process.exit(result.status??1);
