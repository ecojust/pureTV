#!/usr/bin/env python3
"""Reproduce exact Git checkout byte behavior; this is not a native host test."""
import hashlib,json,subprocess,tempfile
from pathlib import Path
import yaml
root=Path.cwd();source='490f84f9dbc07935b7f6c3797809fa5f82bdaa4f';name='.github/workflows/joystick-catalog-windows.yml'
original=subprocess.check_output(['git','show',source+':'+name])
with tempfile.TemporaryDirectory(prefix='windows-eol-regression-') as temporary:
 base=Path(temporary);repo=base/'repo';repo.mkdir()
 def git(*args):return subprocess.check_output(['git','-C',str(repo),*args],stderr=subprocess.STDOUT)
 git('init','-q');git('config','user.name','Local Checkout Regression');git('config','user.email','local@example.invalid')
 (repo/'.gitattributes').write_bytes(b'* text=auto\n');path=repo/name;path.parent.mkdir(parents=True);path.write_bytes(original)
 git('-c','core.autocrlf=false','-c','core.eol=lf','add','.');git('commit','-qm','Frozen workflow fixture')
 converted=base/'converted';exact=base/'exact';converted.mkdir();exact.mkdir()
 git('-c','core.autocrlf=true','-c','core.eol=crlf','checkout-index','--all','--prefix='+str(converted)+'/')
 git('-c','core.autocrlf=false','-c','core.eol=lf','checkout-index','--all','--prefix='+str(exact)+'/')
 wrong=(converted/name).read_bytes();right=(exact/name).read_bytes();assert wrong!=original and wrong.count(b'\r\n')>0;assert right==original
 yaml.safe_load((root/name).read_text())
 print(json.dumps({'platform':'linux','nativeWindowsTested':False,'frozenSource':source,'convertedBytes':len(wrong),'exactBytes':len(right),'sourceBytes':len(original),'convertedDiffers':True,'fixedCheckoutMatchesOriginalBytes':True,'yamlSyntax':'passed','testedWorkflowSha256':hashlib.sha256((root/name).read_bytes()).hexdigest()},indent=2))
