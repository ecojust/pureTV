from pathlib import Path
import collections,hashlib,json,time,zipfile,zlib,os
root=Path('/dev/shm/puretv-submit/joystick-games/backroad-rally/dist')
out=Path('/dev/shm/racing-review-karts/size-review')
class CountFile:
 def __init__(self):self.pos=0;self.size=0
 def write(self,b):self.pos+=len(b);self.size=max(self.size,self.pos);return len(b)
 def tell(self):return self.pos
 def seek(self,p,whence=0):
  if whence==0:self.pos=p
  elif whence==1:self.pos+=p
  elif whence==2:self.pos=self.size+p
  else:raise ValueError(whence)
  return self.pos
 def flush(self):pass
report={'scope':'Read-only compression measurement of every current dist file; no native build, resource removal, altered input or package delivery. Seekable counting sink discards all archive bytes.','startedAt':time.time(),'nice':os.getpriority(os.PRIO_PROCESS,0),'zlib':zlib.ZLIB_RUNTIME_VERSION,'measurements':[]}
for level in (9,6):
 sink=CountFile();entries=[];groups=collections.defaultdict(lambda:{'files':0,'bytes':0,'compressed':0})
 with zipfile.ZipFile(sink,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=level) as archive:
  for path in sorted(root.rglob('*')):
   if not path.is_file():continue
   assert not path.is_symlink()
   name=path.relative_to(root).as_posix();before=path.stat()
   archive.write(path,name)
   entry=archive.getinfo(name);after=path.stat()
   assert (before.st_size,before.st_mtime_ns)==(after.st_size,after.st_mtime_ns)
   data={'name':name,'bytes':entry.file_size,'compressed':entry.compress_size,'crc32':entry.CRC}
   if level==9:data['sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
   entries.append(data);g=groups[path.suffix.lower()];g['files']+=1;g['bytes']+=entry.file_size;g['compressed']+=entry.compress_size
 report['measurements'].append({'compression':'ZIP_DEFLATED','level':level,'archiveBytes':sink.size,'entryCount':len(entries),'uncompressedBytes':sum(e['bytes'] for e in entries),'compressedPayloadBytes':sum(e['compressed'] for e in entries),'groups':dict(groups),'entries':entries})
 print(json.dumps({k:v for k,v in report['measurements'][-1].items() if k not in ('entries','groups')}),flush=True)
report['finishedAt']=time.time();target=out/'backroad-dist-compression.json';target.write_text(json.dumps(report,indent=2)+'\n');print('report',str(target),'bytes',target.stat().st_size,flush=True)
