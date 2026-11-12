import subprocess,re,xml.etree.ElementTree as E
r=E.parse('/workspace/scratch/neon-rush-toolchain/sdk/platforms/android-35/data/api-versions.xml').getroot();classes={c.attrib['name']:c for c in r.findall('class')}
s=subprocess.check_output(['/workspace/scratch/neon-rush-toolchain/sdk/build-tools/34.0.0/dexdump','-d','/workspace/scratch/neon-rush-wifi-signed-final/neon-rush-0.1.1.apk']).decode('utf-8','replace')
refs=set()
for b in re.split(r'(?=Class #\d+\s)',s):
 if re.search(r"Class descriptor\s+: 'Lcom/ecojust/gamekit/",b):
  for l in b.splitlines():
   if 'invoke-' in l:
    m=re.search(r'\}, L([^;]+);\.([^:]+):(\S+)',l)
    if m and m[1].startswith(('android/','java/','org/json/')):refs.add((m[1],m[2]+m[3]))
def since(cls,method,seen=None):
 seen=set() if seen is None else seen
 if cls in seen or cls not in classes:return None
 seen.add(cls);c=classes[cls]
 for m in c.findall('method'):
  if m.attrib['name']==method:return max(int(c.attrib.get('since','1')),int(m.attrib.get('since','1')))
 inherited=[since(v.attrib['name'],method,seen) for v in [*c.findall('extends'),*c.findall('implements')]]
 found=[x for x in inherited if x is not None]
 return min(found) if found else None
late=[];missing=[]
for cls,method in sorted(refs):
 value=since(cls,method)
 if value is None:missing.append((cls,method))
 elif value>26:late.append((value,cls,method))
print({'references':len(refs),'requiringHigherThan26':late,'unmapped':missing})
