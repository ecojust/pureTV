import { buildGame } from '../shared/crisp/build.mjs';
import { fileURLToPath } from 'node:url';
buildGame(fileURLToPath(new URL('.', import.meta.url)));
