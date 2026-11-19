import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import * as esbuild from 'esbuild';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'puretv-rush-tests-'));
try {
  const out=path.join(tmp,'input.test.mjs');
  await esbuild.build({absWorkingDir:root,entryPoints:['tests/input.test.mjs'],outfile:out,bundle:true,platform:'node',format:'esm',target:'node20'});
  const result=spawnSync(process.execPath,['--test',out],{stdio:'inherit'});
  process.exitCode=result.status === null ? 1 : result.status;
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
