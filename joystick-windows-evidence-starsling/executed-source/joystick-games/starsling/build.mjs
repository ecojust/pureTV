import { buildGame } from '../shared/triptych/build.mjs';
import * as esbuild from 'esbuild';
await buildGame(import.meta.url, esbuild);
