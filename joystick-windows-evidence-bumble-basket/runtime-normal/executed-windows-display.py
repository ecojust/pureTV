#!/usr/bin/env python3
"""Temporarily use an enumerated Windows display mode for native GUI QA."""
import ctypes,json,sys

class Point(ctypes.Structure):_fields_=[('x',ctypes.c_int32),('y',ctypes.c_int32)]
class DisplayFields(ctypes.Structure):_fields_=[('position',Point),('orientation',ctypes.c_uint32),('fixedOutput',ctypes.c_uint32)]
class ModeFields(ctypes.Union):_fields_=[('display',DisplayFields),('printer',ctypes.c_byte*16)]
class DevMode(ctypes.Structure):
    _fields_=[('deviceName',ctypes.c_uint16*32),('specVersion',ctypes.c_uint16),('driverVersion',ctypes.c_uint16),('size',ctypes.c_uint16),('driverExtra',ctypes.c_uint16),('fields',ctypes.c_uint32),('mode',ModeFields),('color',ctypes.c_int16),('duplex',ctypes.c_int16),('yResolution',ctypes.c_int16),('ttOption',ctypes.c_int16),('collate',ctypes.c_int16),('formName',ctypes.c_uint16*32),('logPixels',ctypes.c_uint16),('bitsPerPel',ctypes.c_uint32),('pelsWidth',ctypes.c_uint32),('pelsHeight',ctypes.c_uint32),('displayFlags',ctypes.c_uint32),('displayFrequency',ctypes.c_uint32),('icmMethod',ctypes.c_uint32),('icmIntent',ctypes.c_uint32),('mediaType',ctypes.c_uint32),('ditherType',ctypes.c_uint32),('reserved1',ctypes.c_uint32),('reserved2',ctypes.c_uint32),('panningWidth',ctypes.c_uint32),('panningHeight',ctypes.c_uint32)]
assert ctypes.sizeof(DevMode)==220,'DEVMODEW ABI differs from Windows'

def record(mode):
    return {'width':mode.pelsWidth,'height':mode.pelsHeight,'bitsPerPixel':mode.bitsPerPel,'frequency':mode.displayFrequency,'orientation':mode.mode.display.orientation,'displayFlags':mode.displayFlags,'dmFields':mode.fields,'rawDevModeHex':bytes(mode).hex()}

def choose_mode(modes,current):
    candidates=[mode for mode in modes if mode['width']>=1600 and mode['height']>=900 and mode['bitsPerPixel']>=24 and mode['orientation']==current['orientation']]
    assert candidates,'No enumerated display mode can hold the required 1280×720 client and window frame'
    return min(candidates,key=lambda mode:(mode['width']*mode['height'],mode['bitsPerPixel']!=current['bitsPerPixel'],abs(mode['frequency']-current['frequency'])))

class NativeDisplay:
    def __init__(self):
        assert sys.platform=='win32','Requires the actual Windows display API'
        self.api=ctypes.WinDLL('user32',use_last_error=True)
        self.api.EnumDisplaySettingsExW.argtypes=[ctypes.c_wchar_p,ctypes.c_uint32,ctypes.POINTER(DevMode),ctypes.c_uint32]
        self.api.EnumDisplaySettingsExW.restype=ctypes.c_int
        self.api.ChangeDisplaySettingsExW.argtypes=[ctypes.c_wchar_p,ctypes.POINTER(DevMode),ctypes.c_void_p,ctypes.c_uint32,ctypes.c_void_p]
        self.api.ChangeDisplaySettingsExW.restype=ctypes.c_int32
        self.api.SystemParametersInfoW.argtypes=[ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p,ctypes.c_uint32]
        self.api.GetSystemMetrics.argtypes=[ctypes.c_int]
    def mode(self,index):
        mode=DevMode();mode.size=ctypes.sizeof(mode)
        return record(mode) if self.api.EnumDisplaySettingsExW(None,index,ctypes.byref(mode),0) else None
    def modes(self):
        result=[]
        for index in range(4096):
            mode=self.mode(index)
            if mode is None:return result
            result.append(mode)
        raise AssertionError('Display mode enumeration did not terminate')
    def snapshot(self):
        class Rect(ctypes.Structure):_fields_=[(key,ctypes.c_int32) for key in ('left','top','right','bottom')]
        work=Rect();assert self.api.SystemParametersInfoW(0x30,0,ctypes.byref(work),0),'Cannot observe desktop work area'
        current=self.mode(0xffffffff);assert current,'Cannot observe current display mode'
        return {'currentMode':current,'screenPixels':[self.api.GetSystemMetrics(0),self.api.GetSystemMetrics(1)],'virtualScreenPixels':[self.api.GetSystemMetrics(78),self.api.GetSystemMetrics(79)],'workArea':{key:getattr(work,key) for key in ('left','top','right','bottom')}}
    def change(self,mode,test=False):
        native=DevMode.from_buffer_copy(bytes.fromhex(mode['rawDevModeHex']))
        assert native.size==220 and native.driverExtra==0,'Unrecognized enumerated display mode layout'
        # CDS_TEST validates the enumerated mode; flags=0 changes it for this
        # session only. CDS_UPDATEREGISTRY is deliberately never used.
        return self.api.ChangeDisplaySettingsExW(None,ctypes.byref(native),None,2 if test else 0,None)

class DisplaySession:
    def __init__(self,output,api=None):
        self.path=output;self.api=api or NativeDisplay();self.original=None;self.changed=False
        self.report={'status':'running','method':'EnumDisplaySettingsExW, CDS_TEST, temporary ChangeDisplaySettingsExW; original mode restored in finally','persistentRegistryChange':False}
    def save(self):self.path.write_text(json.dumps(self.report,indent=2)+'\n',encoding='utf-8')
    def prepare(self):
        try:
            self.report['before']=self.api.snapshot();self.original=self.report['before']['currentMode']
            self.report['enumeratedModes']=self.api.modes()
            if self.original['width']<1600 or self.original['height']<900:
                selected=choose_mode(self.report['enumeratedModes'],self.original);self.report['selectedMode']=selected
                result=self.api.change(selected,test=True);self.report['testReturnCode']=result
                assert result==0,'Windows rejected the enumerated display mode during CDS_TEST'
                # A rejected apply can still change state; always attempt original restoration.
                self.changed=True;result=self.api.change(selected);self.report['applyReturnCode']=result
                assert result==0,'Windows did not apply the enumerated QA display mode'
            self.report['after']=self.api.snapshot();actual=self.report['after']['currentMode']
            assert actual['width']>=1600 and actual['height']>=900,'Actual display did not reach the required QA size'
            assert self.report['after']['screenPixels'][0]>=1600 and self.report['after']['screenPixels'][1]>=900,'Primary desktop dimensions do not match the observed mode'
            self.report['status']='prepared'
        except Exception as error:self.report.update(status='failed',error=str(error));raise
        finally:self.save()
    def restore(self):
        try:
            if self.changed:
                result=self.api.change(self.original);self.report['restoreReturnCode']=result
                assert result==0,'Could not restore original Windows display mode'
                self.report['restored']=self.api.snapshot()
                current=self.report['restored']['currentMode']
                assert all(current[key]==self.original[key] for key in ('width','height','bitsPerPixel','frequency','orientation')),'Original Windows display mode was not restored'
            self.report['originalModeRestored']=True
        except Exception as error:self.report.update(status='failed',restoreError=str(error));raise
        finally:self.save()
