// Read-only observation strategy: output physical button choices, never alter state.
import readline from 'node:readline';
import { keys } from '../../tests/automation.mjs';
for await (const line of readline.createInterface({input:process.stdin})) {
  try { console.log(JSON.stringify(keys(JSON.parse(line), {mode:'qa'}))); }
  catch (error) { console.log(JSON.stringify({error:String(error)})); }
}
