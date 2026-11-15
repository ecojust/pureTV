#!/usr/bin/env python3
"""Install actual signed APKs and drive them through the original SDK QA runner."""
import argparse
import atexit
import importlib.util
import json
import os
import re
import signal
from pathlib import Path
import subprocess
import time
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('controller_release',ROOT/'tools/controller-release.py')
release=importlib.util.module_from_spec(spec);spec.loader.exec_module(release)

BATCHES = {
    'arcade-1': ('arcade', ['tank', 'jackal']),
    'arcade-2': ('arcade', ['jewel', 'tetris']),
    'arcade-3': ('arcade', ['bomb-jack', 'adventure-island', 'super-mario']),
    'worlds-1': ('worlds', ['coast-kart', 'cozy-island']),
    'worlds-2': ('worlds', ['used-car-racing', 'alien-shooter']),
    'kit-1': ('kit', ['neon-rush', 'twenty-four', 'torch-bridge']),
    'kit-2': ('kit', ['tower-overlap', 'packing-sculptor', 'conveyor-window']),
    'kit-3': ('kit', ['glass-fold', 'tension-span', 'prism-relay']),
}
DEFAULT_BATCHES = tuple(BATCHES)
BATCHES.update({
    'retry-used-car': ('worlds', ['used-car-racing']),
    'retry-alien': ('worlds', ['alien-shooter']),
    'retry-prism': ('kit', ['prism-relay']),
    'retry-arcade-visual': ('arcade', ['tank', 'jackal']),
})

def runtime_plan(requested=''):
    """Validate dispatch selection before it can become a matrix or shell input."""
    names = json.loads(requested) if requested.strip() else list(DEFAULT_BATCHES)
    assert isinstance(names, list) and names, 'batches must be a nonempty JSON array'
    assert all(isinstance(name, str) and name in BATCHES for name in names), 'Only predefined batch names are accepted'
    assert len(names) == len(set(names)), 'Duplicate batches are not accepted'
    selected = [name for name in BATCHES if name in names]
    slugs = [slug for name in selected for slug in BATCHES[name][1]]
    assert len(slugs) == len(set(slugs)), 'Selected batches must not repeat a game through parent and retry aliases'
    standard_options = '-no-window -memory 3072 -gpu swiftshader_indirect -noaudio -no-boot-anim -no-snapshot'
    matrix = [{'group': BATCHES[name][0], 'batch': name,
               'apiLevel': 29 if name in ['retry-used-car', 'retry-arcade-visual'] else 36,
               'arch': 'x86' if name in ['retry-used-car', 'retry-arcade-visual'] else 'x86_64',
               'renderer': 'swiftshader' if name == 'retry-used-car' else 'swiftshader_indirect',
               'emulatorOptions': (standard_options.replace('-gpu swiftshader_indirect', '-gpu swiftshader') if name == 'retry-used-car' else standard_options)
                    + (' -feature -Vulkan -verbose' if name in ['worlds-2', 'retry-used-car', 'retry-arcade-visual'] else '')}
              for name in selected]
    return {'requestedBatches': names, 'selectedBatches': selected, 'plannedSlugs': slugs,
            'completeCatalogRequested': len(slugs) == len(release.ALL_SLUGS),
            'matrix': {'include': matrix},
            'worlds2GraphicsExperiment': {'selected': any(name in selected for name in ['worlds-2', 'retry-used-car']),
                'description': 'Disable Vulkan while retaining SwiftShader and enable verbose emulator logs; the preceding AVD failure has no established root cause.'},
            'usedCarStableImageComparison': {'selected': 'retry-used-car' in selected,
                'systemImage': 'system-images;android-29;android-tv;x86',
                'channel': 'stable', 'revisionListedByOfficialRepository': 3,
                'rendererComparison': {'previousObservedEmulatorVersion': '37.2.13',
                    'previousRenderer': 'swiftshader_indirect', 'requestedRenderer': 'swiftshader',
                    'previousRendererDeprecatedSince': '36.4.9',
                    'officialReference': 'https://developer.android.com/studio/run/emulator-acceleration'},
                'description': 'Independent AVD on the official older stable TV image; installation, WebView, WebGL and controller acceptance remain mandatory.'},
            'arcadeVisualStableImageComparison': {'selected': 'retry-arcade-visual' in selected,
                'systemImage': 'system-images;android-29;android-tv;x86',
                'description': 'Recheck Tank and Jackal after transient black regions were observed in API36 recordings; preserve full controller acceptance and new visual evidence.'}}

def selected_slugs(group, batch=None):
    allowed = release.KIT_SLUGS if group == 'kit' else release.GROUPS[group]
    if batch is None:
        return list(allowed)
    expected_group, slugs = BATCHES[batch]
    assert group == expected_group and set(slugs) <= set(allowed), 'Batch must retain its exact artifact source group'
    assert 1 <= len(slugs) <= 3 and len(set(slugs)) == len(slugs)
    return list(slugs)


class ContinuousLogcat:
    """Keep pre-crash device logs even if a later adb logcat -d cannot connect."""
    def __init__(self, adb, directory):
        self.directory = directory
        self.stream = (directory / 'continuous-logcat.txt').open('w')
        self.command = adb + ['logcat', '-v', 'threadtime']
        self.process = subprocess.Popen(self.command, stdout=self.stream, stderr=subprocess.STDOUT, text=True)
        self.closed = False
        atexit.register(self.close)

    def close(self):
        if self.closed:
            return
        self.closed = True
        exit_before_stop = self.process.poll()
        if exit_before_stop is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill(); self.process.wait(timeout=5)
        self.stream.close()
        release.write(self.directory / 'continuous-logcat-status.json',
                      {'command': self.command, 'exitBeforeCollectorStop': exit_before_stop,
                       'finalExitCode': self.process.returncode,
                       'terminatedOnlyOwnedAdbClient': exit_before_stop is None})
        atexit.unregister(self.close)

def baseline_release(slug, artifact_source, signed, build_tools):
    assert slug in release.ALL_SLUGS and re.fullmatch('[a-f0-9]{40}', artifact_source)
    metadata_path='resource/apps/'+slug+'/resource.json'
    old=json.loads(subprocess.check_output(['git','show',artifact_source+':'+metadata_path],cwd=ROOT))
    assert Path(old['apk']).name==old['apk'] and '/' not in old['apk'] and '\\' not in old['apk']
    old_apk=ROOT/'resource/apps'/slug/old['apk']
    prior=release.info(old_apk,build_tools)
    keys={'packageName':'packageName','versionName':'version','versionCode':'versionCode','sha256':'sha256','bytes':'apkBytes','certificateSha256':'certificateSha256'}
    assert all(prior[k]==old[v] for k,v in keys.items()),'Baseline APK must match its committed resource metadata'
    assert old['packageName']==signed['packageName'] and old['versionCode']<signed['versionCode']
    assert prior['certificateSha256']==signed['certificateSha256']
    return old_apk, {'baselineMetadataRef':artifact_source+':'+metadata_path,'identity':prior}

def configure_disposable_emulator(command, adb, serial, environment, receipt_path):
    # Never change verifier settings on a real device or without explicit CI opt-in.
    assert environment.get('PURETV_DISPOSABLE_EMULATOR')=='1', 'Disposable emulator opt-in is required'
    assert re.fullmatch(r'emulator-[0-9]+',serial), 'Only an explicit emulator serial is accepted'
    assert adb[-2:]==['-s',serial], 'Every configuration command must target this emulator'
    qemu=command(adb+['shell','getprop','ro.kernel.qemu']).strip()
    assert qemu=='1', 'Device must independently identify itself as the Android emulator'
    keys=['verifier_verify_adb_installs','package_verifier_enable']
    record={'status':'configuring','disposableEmulator':True,'serial':serial,'kernelQemu':qemu,
            'fingerprint':command(adb+['shell','getprop','ro.build.fingerprint']).strip(),
            'sdk':command(adb+['shell','getprop','ro.build.version.sdk']).strip(),
            'before':{key:command(adb+['shell','settings','get','global',key]).strip() for key in keys},
            'after':{},'commands':[],
            'purpose':'Only this disposable CI emulator skips cloud ADB install verification; release APK signature verification remains required.'}
    release.write(receipt_path,record)
    try:
        for key in keys:
            args=adb+['shell','settings','put','global',key,'0']
            output=command(args);record['commands'].append({'command':args,'stdout':output})
        record['after']={key:command(adb+['shell','settings','get','global',key]).strip() for key in keys}
        assert all(value=='0' for value in record['after'].values()), 'Disposable emulator verifier settings were not applied'
        record['status']='configured'
        return record
    except Exception as error:
        record['status']='failed';record['error']=repr(error);raise
    finally:
        release.write(receipt_path,record)

def main():
    p=argparse.ArgumentParser();p.add_argument('--group',choices=['arcade','worlds','kit'],required=True)
    p.add_argument('--batch', choices=sorted(BATCHES))
    p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--adb',default='adb');p.add_argument('--serial',default='emulator-5554');p.add_argument('--artifact-source',required=True);p.add_argument('--legacy-source');p.add_argument('--build-tools',type=Path,default=Path(os.environ.get('ANDROID_HOME',''))/'build-tools/34.0.0')
    a=p.parse_args();a.legacy_source=a.legacy_source or a.artifact_source;a.output.mkdir(parents=True,exist_ok=False)
    slugs=selected_slugs(a.group,a.batch)
    adb=[a.adb,'-s',a.serial]
    def command(args,timeout=120):
        result=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
        if result.returncode:
            raise RuntimeError(json.dumps({'command':args,'exitCode':result.returncode,'stdout':result.stdout,'stderr':result.stderr}))
        return result.stdout
    def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    report={'sourceSha':a.artifact_source,'legacySourceSha':a.legacy_source,'group':a.group,'batch':a.batch,'plannedSlugs':slugs,'physicalTvTested':False,'physicalEsp32Tested':False,'actualAndroidEmulator':True,'cases':[]}
    report['androidProperties']=command(adb+['shell','getprop'])
    report['emulatorConfiguration']=configure_disposable_emulator(command,adb,a.serial,os.environ,a.output/'emulator-configuration.json')
    live_logcat=ContinuousLogcat(adb,a.output)
    for slug in slugs:
        directory=a.output/slug;directory.mkdir()
        case={'slug':slug,'status':'running'};report['cases'].append(case)
        process=None;video=None;video_stream=None;ports=[];target=None;observer=None
        remote_video="/sdcard/puretv-controller-"+slug+".mp4"
        try:
            package=a.input/'packages'/slug
            signed=json.loads((package/'signing-receipt.json').read_text())
            observation=json.loads((a.input/'observers'/slug/'observer-signing-receipt.json').read_text())
            target=signed['packageName'];observer=observation['packageName']
            artifact_source=a.artifact_source if slug in release.KIT_SLUGS else a.legacy_source
            assert signed['sourceSha']==artifact_source and observation['sourceSha']==a.legacy_source
            case['artifactSourceSha']=artifact_source;case['observerSourceSha']=a.legacy_source
            assert target==observation['targetPackage'] and observation['modelWrites'] is False
            apks=list(package.glob('*.apk'));assert len(apks)==1
            observer_apk=a.input/'observers'/slug/observation['apk']
            old_apk,baseline=baseline_release(slug,artifact_source,signed,a.build_tools)
            save(directory/'baseline-release.json',baseline)
            installs=[]
            command(adb+['shell','am','force-stop',target])
            installs.append(command(adb+['install','-r',str(old_apk)]))
            installs.append(command(adb+['install','-r',str(apks[0])]))
            installs.append(command(adb+['install','-r','-t',str(observer_apk)]))
            assert all('Success' in text for text in installs)
            (directory/'install.txt').write_text('\n'.join(installs))
            case['inPlaceUpgradeInstalled']=True
            case['packageSha256']=release.digest(apks[0]);case['observerSha256']=release.digest(observer_apk)
            command(adb+['logcat','-c'])
            stream=(directory/'instrumentation.txt').open('w')
            instrument=adb+['shell','am','instrument','-w','-e','diagnosticPort','63486',observation['component']]
            process=subprocess.Popen(instrument,stdout=stream,stderr=subprocess.STDOUT,text=True)
            for device in [63486,63485]:
                port=int(command(adb+['forward','tcp:0','tcp:'+str(device)]).strip());ports.append(port)
            diagnostics='http://127.0.0.1:'+str(ports[0])
            deadline=time.monotonic()+75;ready=None
            while time.monotonic()<deadline:
                assert process.poll() is None,'Instrumentation exited before observer was ready'
                try:
                    with urllib.request.urlopen(diagnostics+'/snapshot',timeout=15) as response:
                        ready=json.load(response)
                    if ready and ready.get('game') and (ready.get('info') or {}).get('wifiController',{}).get('port')==63485:break
                except Exception:time.sleep(.5)
            assert ready and ready.get('game') and (ready.get('info') or {}).get('wifiController',{}).get('port')==63485,'Observer could not read the ready release WebView and controller service'
            save(directory/'initial-snapshot.json',ready)
            run=['node',str(ROOT/'tools/readme-controller-qa/run.mjs'),'--mode','android','--slug',slug,
                 '--diagnostics',diagnostics,'--tcp-port',str(ports[1]),'--output',str(directory/'gameplay'),
                 '--adb',a.adb,'--serial',a.serial]
            video_command=adb+['shell','screenrecord','--size','960x540','--bit-rate','600000','--time-limit','120',remote_video]
            video_stream=(directory/'screenrecord.txt').open('w')
            video=subprocess.Popen(video_command,stdout=video_stream,stderr=subprocess.STDOUT,text=True)
            save(directory/'commands.json',{'instrumentation':instrument,'driver':run,'video':video_command,'ports':ports})
            with (directory/'driver.log').open('w') as log:
                driver=subprocess.Popen(run,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
                try:
                    return_code=driver.wait(timeout=360)
                    if return_code:raise subprocess.CalledProcessError(return_code,run)
                except subprocess.TimeoutExpired:
                    os.killpg(driver.pid,signal.SIGTERM)
                    try:driver.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        os.killpg(driver.pid,signal.SIGKILL);driver.wait(timeout=10)
                    raise
            case['status']='passed'
        except Exception as error:
            case['status']='failed';case['error']=repr(error)
            try:
                shot=subprocess.run(adb+['exec-out','screencap','-p'],check=True,capture_output=True,timeout=20).stdout
                (directory/'failure-screen.png').write_bytes(shot)
            except Exception:pass
        finally:
            if video:
                try:
                    if video.poll() is None:
                        ids=command(adb+['shell','pidof','screenrecord'],10).split()
                        assert len(ids)==1 and ids[0].isdigit(),'Expected only this batch screen recorder'
                        command(adb+['shell','kill','-2',ids[0]],10)
                    video.wait(timeout=20)
                    video_file=directory/'gameplay.mp4'
                    command(adb+['pull',remote_video,str(video_file)],30)
                    assert video_file.stat().st_size>1024,'Android screenrecord produced no video'
                    video_info=json.loads(command(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video_file)],20))
                    assert any(v.get('codec_type')=='video' for v in video_info['streams']) and float(video_info['format']['duration'])>1
                    save(directory/'recording-probe.json',video_info)
                    case['recording']={'file':'gameplay.mp4','bytes':video_file.stat().st_size,'sha256':release.digest(video_file),'method':'Android screenrecord during ordinary SDK/virtual-page inputs','maximumSeconds':120,'size':'960x540','bitRate':600000,'encodingRateIsNotDevicePerformance':True}
                except Exception as error:
                    case['status']='failed';case['recordingError']=repr(error)
                    if video.poll() is None:video.terminate()
                finally:
                    video_stream.close()
                    subprocess.run(adb+['shell','rm','-f',remote_video],capture_output=True,timeout=20)
            try:(directory/'logcat.txt').write_text(command(adb+['logcat','-d','-v','threadtime'],30))
            except Exception as error:(directory/'logcat-error.txt').write_text(repr(error))
            for package_name in [target,observer]:
                if package_name:
                    subprocess.run(adb+['shell','am','force-stop',package_name],capture_output=True,timeout=20)
            if process:
                try:process.wait(timeout=10)
                except subprocess.TimeoutExpired:process.terminate();process.wait(timeout=10)
                stream.close()
            for port in ports:subprocess.run(adb+['forward','--remove','tcp:'+str(port)],capture_output=True,timeout=20)
            save(directory/'case.json',case);save(a.output/'report.json',report)
            print(json.dumps(case,ensure_ascii=False),flush=True)
    report['status']='passed' if all(row['status']=='passed' for row in report['cases']) else 'failed'
    live_logcat.close()
    save(a.output/'report.json',report)
    assert report['status']=='passed','Some signed APKs failed actual Android controller checks'

if __name__=='__main__':main()
