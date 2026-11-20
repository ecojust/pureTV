async function pauseForProtocol(){
 // A round can finish while a real screenshot is captured or between this read
 // and START. In a result screen START restarts; only an observed pause is ready.
 for(let attempt=1;attempt<=3;attempt++){
  const before=await read();trace('protocol-pause-setup-before-'+attempt,null,before);
  if(before.paused||before.phase==='paused')return before;
  await tap('START');const after=await read();trace('protocol-pause-setup-attempt-'+attempt,before,after);
  if(after.paused||after.phase==='paused')return after;
 }
 assert.fail('protocol test pause did not reach paused after 3 ordinary START presses');
}
