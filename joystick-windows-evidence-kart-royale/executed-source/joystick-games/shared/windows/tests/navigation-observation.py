"""Bounded, read-only diagnostics for a fixture's own Windows process.

No input, focus changes, environment, command line or unrelated window text.
This module never decides whether the game or document fixture passes.
"""
import ctypes,sys,time
from ctypes import wintypes

MAX_WINDOWS=16
MAX_CHILDREN=64
MAX_VISITS=4096
MAX_TEXT=1024
MAX_SECONDS=3

class Win32Windows:
    def __init__(self):
        assert sys.platform=='win32','Actual Win32 window observation requires Windows'
        self.user=ctypes.WinDLL('user32',use_last_error=True)
        self.callback=ctypes.WINFUNCTYPE(wintypes.BOOL,wintypes.HWND,wintypes.LPARAM)
        self.user.EnumWindows.argtypes=[self.callback,wintypes.LPARAM];self.user.EnumWindows.restype=wintypes.BOOL
        self.user.EnumChildWindows.argtypes=[wintypes.HWND,self.callback,wintypes.LPARAM];self.user.EnumChildWindows.restype=wintypes.BOOL
        self.user.GetWindowThreadProcessId.argtypes=[wintypes.HWND,ctypes.POINTER(wintypes.DWORD)];self.user.GetWindowThreadProcessId.restype=wintypes.DWORD
        self.user.GetClassNameW.argtypes=[wintypes.HWND,wintypes.LPWSTR,ctypes.c_int];self.user.GetClassNameW.restype=ctypes.c_int
        self.user.IsWindowVisible.argtypes=[wintypes.HWND];self.user.IsWindowVisible.restype=wintypes.BOOL
        self.user.GetWindowRect.argtypes=[wintypes.HWND,ctypes.POINTER(wintypes.RECT)];self.user.GetWindowRect.restype=wintypes.BOOL
        self.user.SendMessageTimeoutW.argtypes=[wintypes.HWND,wintypes.UINT,wintypes.WPARAM,wintypes.LPARAM,wintypes.UINT,wintypes.UINT,ctypes.POINTER(ctypes.c_size_t)]
        self.user.SendMessageTimeoutW.restype=wintypes.LPARAM
    def enumerate(self,parent,visit):
        stopped=False
        def callback(hwnd,_):
            nonlocal stopped
            keep=visit(hwnd);stopped|=not keep;return bool(keep)
        function=self.callback(callback);ctypes.set_last_error(0)
        result=self.user.EnumWindows(function,0) if parent is None else self.user.EnumChildWindows(parent,function,0)
        error=ctypes.get_last_error()
        # EnumChildWindows documents no meaningful return value.
        if parent is None and not result and not stopped and error:raise OSError(error,'EnumWindows failed')
    def pid(self,hwnd):
        pid=wintypes.DWORD()
        if not self.user.GetWindowThreadProcessId(hwnd,ctypes.byref(pid)):raise ctypes.WinError(ctypes.get_last_error())
        return pid.value
    def class_name(self,hwnd):
        value=ctypes.create_unicode_buffer(256)
        if not self.user.GetClassNameW(hwnd,value,len(value)):raise ctypes.WinError(ctypes.get_last_error())
        return value.value
    def describe(self,hwnd):
        rect=wintypes.RECT();valid=bool(self.user.GetWindowRect(hwnd,ctypes.byref(rect)))
        value=ctypes.create_unicode_buffer(MAX_TEXT+1);copied=ctypes.c_size_t();ctypes.set_last_error(0)
        # WM_GETTEXT / SMTO_BLOCK | SMTO_ABORTIFHUNG, at most 100 ms per call.
        okay=self.user.SendMessageTimeoutW(hwnd,13,len(value),ctypes.cast(value,ctypes.c_void_p).value,3,100,ctypes.byref(copied))
        return {'visible':bool(self.user.IsWindowVisible(hwnd)),
            'rect':{'left':rect.left,'top':rect.top,'right':rect.right,'bottom':rect.bottom} if valid else None,
            'text':value.value if okay else None,'textWin32Error':None if okay else ctypes.get_last_error()}

def collect_owned_windows(pid,api=None,clock=time.monotonic):
    assert type(pid) is int and pid>0
    api=api or Win32Windows();started=clock();visits=0;children=0
    result={'scope':'Only windows whose current process ID equals the launched fixture PID',
        'processId':pid,'windows':[],'errors':[],'bounded':False,'limits':{'windows':MAX_WINDOWS,'children':MAX_CHILDREN,'visits':MAX_VISITS,'textCharacters':MAX_TEXT,'seconds':MAX_SECONDS}}
    def available():
        nonlocal visits
        visits+=1
        if visits>MAX_VISITS or clock()-started>=MAX_SECONDS:result['bounded']=True;return False
        return True
    def failure(error):
        if len(result['errors'])<16:result['errors'].append({'type':type(error).__name__,'message':str(error)[:256]})
    def observation(hwnd,kind):
        data=api.describe(hwnd)
        # Keep only the fixed evidence fields, even for an injected test API.
        return {'class':kind[:256],'visible':data.get('visible'),'rect':data.get('rect'),
            'text':data.get('text')[:MAX_TEXT] if isinstance(data.get('text'),str) else None,'textWin32Error':data.get('textWin32Error')}
    def top(hwnd):
        nonlocal children
        if not available():return False
        try:
            if api.pid(hwnd)!=pid:return True
            if len(result['windows'])>=MAX_WINDOWS:result['bounded']=True;return False
            row=observation(hwnd,api.class_name(hwnd));row['staticChildren']=[];result['windows'].append(row)
            def child(item):
                nonlocal children
                if not available():return False
                if children>=MAX_CHILDREN:result['bounded']=True;return False
                try:
                    if api.pid(item)==pid and api.class_name(item)=='Static':
                        children+=1;row['staticChildren'].append(observation(item,'Static'))
                except Exception as error:failure(error)
                return True
            api.enumerate(hwnd,child)
        except Exception as error:failure(error)
        return True
    try:api.enumerate(None,top)
    except Exception as error:failure(error)
    result['elapsedSeconds']=clock()-started
    return result
