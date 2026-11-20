import subprocess,pathlib,sys,re,json
base=pathlib.Path('/dev/shm/racing-review-driving/windows-44606210717');game,job=sys.argv[1:]
p=subprocess.run(['gh','run','view','44606210717','--job',job,'--log','--repo','ecojust/pureTV'],capture_output=True,timeout=45)
(base/(game+'-job.log')).write_bytes(p.stdout)
err=re.sub(r'https?://[^\s?]+\?\S+', '[signed URL query redacted]',p.stderr.decode(errors='replace'));(base/(game+'-job-fetch-error.txt')).write_text(err)
print(json.dumps({'game':game,'job':job,'returncode':p.returncode,'logBytes':len(p.stdout),'errorBytes':len(err)}))
