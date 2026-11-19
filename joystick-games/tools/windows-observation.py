#!/usr/bin/env python3
"""Read fresh native diagnostic bytes with bounded retries, never cached state."""
import ctypes,json,struct,sys,time,zlib
from pathlib import Path

def shared_bytes(path):
    if sys.platform!='win32':return Path(path).read_bytes()
    # The native writer atomically replaces state.json. CRT file opens need
    # not grant FILE_SHARE_DELETE, so use an explicit replacement-safe read.
    api=ctypes.WinDLL('kernel32',use_last_error=True)
    api.CreateFileW.argtypes=[ctypes.c_wchar_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p];api.CreateFileW.restype=ctypes.c_void_p
    api.ReadFile.argtypes=[ctypes.c_void_p,ctypes.c_void_p,ctypes.c_uint32,ctypes.POINTER(ctypes.c_uint32),ctypes.c_void_p];api.ReadFile.restype=ctypes.c_int
    api.CloseHandle.argtypes=[ctypes.c_void_p];api.CloseHandle.restype=ctypes.c_int
    handle=api.CreateFileW(str(path),0x80000000,1|2|4,None,3,0x80,None)
    if handle==ctypes.c_void_p(-1).value:raise ctypes.WinError(ctypes.get_last_error())
    try:
        parts=[];size=0
        while True:
            buffer=ctypes.create_string_buffer(65536);read=ctypes.c_uint32()
            if not api.ReadFile(handle,buffer,len(buffer),ctypes.byref(read),None):raise ctypes.WinError(ctypes.get_last_error())
            if not read.value:break
            # The diagnostic includes several copies of the bounded 64 MiB
            # native store; do not reject otherwise valid large saved values.
            size+=read.value;assert size<=512*1024*1024,'Native diagnostic file exceeds 512 MiB'
            parts.append(buffer.raw[:read.value])
        return b''.join(parts)
    finally:api.CloseHandle(handle)

def read_state(path,errors,*,required,alive,reader=shared_bytes,clock=time.monotonic,wait=time.sleep):
    deadline=clock()+.5;attempt=0
    while True:
        alive();attempt+=1
        try:
            value=json.loads(reader(path).decode('utf-8'))
            assert isinstance(value,dict),'Native diagnostic root is not an object'
            return value
        except (OSError,ValueError) as error:
            if len(errors)<256:errors.append({'attempt':attempt,'exception':type(error).__name__,'message':str(error),'winerror':getattr(error,'winerror',None)})
            if not required and isinstance(error,FileNotFoundError):return None
            if clock()>=deadline:raise AssertionError('No readable native diagnostic snapshot within 0.5 seconds: '+str(error)) from error
            wait(.025)

def complete_png(data):
    """Check the whole original capture, including every chunk CRC and IEND."""
    if not isinstance(data,bytes) or not 45<=len(data)<=32*1024*1024 or data[:8]!=b'\x89PNG\r\n\x1a\n':raise ValueError('Incomplete PNG signature or size')
    offset=8;dimensions=None;image_data=False;chunks=0
    while offset<len(data):
        if offset+12>len(data):raise ValueError('Incomplete PNG chunk header')
        size=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];end=offset+12+size
        if end>len(data):raise ValueError('Incomplete PNG chunk')
        payload=data[offset+8:offset+8+size];crc=struct.unpack('>I',data[offset+8+size:end])[0]
        if zlib.crc32(kind+payload)&0xffffffff!=crc:raise ValueError('PNG chunk CRC mismatch')
        if chunks==0:
            if kind!=b'IHDR' or size!=13:raise ValueError('Missing PNG IHDR')
            width,height,depth,color,compression,filter_method,interlace=struct.unpack('>IIBBBBB',payload)
            if not (0<width<=16384 and 0<height<=16384 and width*height<=16777216 and depth in (1,2,4,8,16) and color in (0,2,3,4,6) and compression==filter_method==0 and interlace in (0,1)):raise ValueError('Invalid PNG IHDR')
            dimensions=(width,height)
        elif kind==b'IHDR':raise ValueError('Duplicate PNG IHDR')
        if kind==b'IDAT':image_data=True
        if kind==b'IEND':
            if size!=0 or not image_data or end!=len(data):raise ValueError('Incomplete or trailing PNG data')
            return dimensions
        offset=end;chunks+=1
    raise ValueError('Missing PNG IEND')

def read_png(path,record,*,alive,reader=shared_bytes,clock=time.monotonic,wait=time.sleep,timeout=60):
    """Wait for CapturePreview to release its exclusive stream; never reuse bytes."""
    assert type(timeout) in (int,float) and 0<timeout<=60,'PNG wait must remain bounded by 60 seconds'
    started=clock();record.update(timeoutSeconds=timeout,attempts=0,errors=[],status='waiting')
    while True:
        alive();record['attempts']+=1;data=None
        try:
            data=reader(path);dimensions=complete_png(data)
            elapsed=clock()-started
            if elapsed>timeout:raise TimeoutError('PNG completed after capture deadline')
            record.update(status='complete',elapsedSeconds=elapsed,pixelSize=list(dimensions))
            return data
        except (OSError,ValueError) as error:
            elapsed=clock()-started
            if len(record['errors'])<256:record['errors'].append({'attempt':record['attempts'],'elapsedSeconds':elapsed,'exception':type(error).__name__,'message':str(error)[:400],'winerror':getattr(error,'winerror',None),'observedBytes':len(data) if isinstance(data,bytes) else None})
            if elapsed>=timeout:
                record.update(status='failed',elapsedSeconds=elapsed)
                raise AssertionError('No complete readable native PNG within '+str(timeout)+' seconds') from error
            wait(min(.1,timeout-elapsed))
