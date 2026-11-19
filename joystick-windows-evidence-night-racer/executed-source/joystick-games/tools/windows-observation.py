#!/usr/bin/env python3
"""Read fresh native diagnostic bytes with bounded retries, never cached state."""
import ctypes,json,sys,time
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
