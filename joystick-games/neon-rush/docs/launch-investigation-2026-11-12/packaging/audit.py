from pathlib import Path
import subprocess,os,json,hashlib,zipfile,struct
r=Path('/workspace/pureTV');out=Path(__file__).parent;tools=Path('/workspace/scratch/neon-rush-toolchain/sdk/build-tools/34.0.0');env=dict(os.environ,JAVA_HOME='/workspace/scratch/neon-rush-toolchain/jdk17')
def run(slug,name,args):
 p=subprocess.run([str(a) for a in args],env=env,capture_output=True,text=True,errors="backslashreplace")
 (out/(slug+'-'+name+'.txt')).write_text(p.stdout+'\n'+p.stderr)
 return {'exitCode':p.returncode,'report':slug+'-'+name+'.txt'}
summary={}
for slug,version in [('neon-rush','0.1.1'),('hifini','0.5.0')]:
 apk=r/'resource/apps'/slug/(slug+'-'+version+'.apk');data=apk.read_bytes()
 row={'apk':str(apk.relative_to(r)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
 row['badging']=run(slug,'badging',[tools/'aapt2','dump','badging',apk])
 row['manifest']=run(slug,'manifest',[tools/'aapt2','dump','xmltree','--file','AndroidManifest.xml',apk])
 row['signature']=run(slug,'signature',[tools/'apksigner','verify','--verbose','--print-certs',apk])
 row['alignment']=run(slug,'alignment',[tools/'zipalign','-c','-v','4',apk])
 with zipfile.ZipFile(apk) as z:
  row['zipCrcValid']=z.testzip() is None;row['nativeLibraries']=[n for n in z.namelist() if n.startswith('lib/')];row['assets']=[n for n in z.namelist() if n.startswith('assets/')];row['dex']=[]
  for n in z.namelist():
   if n.endswith('.dex'):
    dex=z.read(n);path=out/(slug+'-'+n);path.write_bytes(dex)
    row['dex'].append({'name':n,'version':dex[:8].decode('ascii').strip('\0\n'),'bytes':len(dex),'compressed':z.getinfo(n).compress_type!=0,'classDefinitions':struct.unpack_from('<I',dex,96)[0]})
    row['dexDump']=run(slug,'dexdump',[tools/'dexdump','-d',path])
  row['zipMembers']=[{'name':x.filename,'bytes':x.file_size,'compressedBytes':x.compress_size,'compressionMethod':x.compress_type} for x in z.infolist()]
 summary[slug]=row
(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:{x:v[x] for x in ['bytes','nativeLibraries','dex','zipCrcValid']} for k,v in summary.items()},indent=2))
