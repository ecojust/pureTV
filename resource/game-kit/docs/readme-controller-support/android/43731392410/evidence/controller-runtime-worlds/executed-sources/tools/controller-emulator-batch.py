#!/usr/bin/env python3
"""Install actual signed APKs and drive them through the original SDK QA runner."""
import argparse
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

def main():
    p=argparse.ArgumentParser();p.add_argument('--group',choices=['arcade','worlds','kit'],required=True)
    p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
    p.add_argument('--adb',default='adb');p.add_argument('--serial',default='emulator-5554');p.add_argument('--artifact-source',required=True);p.add_argument('--legacy-source');p.add_argument('--build-tools',type=Path,default=Path(os.environ.get('ANDROID_HOME',''))/'build-tools/34.0.0')
    a=p.parse_args();a.legacy_source=a.legacy_source or a.artifact_source;a.output.mkdir(parents=True,exist_ok=False)
    slugs=release.KIT_SLUGS if a.group=='kit' else release.GROUPS[a.group]
    adb=[a.adb,'-s',a.serial]
    def command(args,timeout=120):
        result=subprocess.run(args,capture_output=True,text=True,timeout=timeout)
        if result.returncode:
            raise RuntimeError(json.dumps({'command':args,'exitCode':result.returncode,'stdout':result.stdout,'stderr':result.stderr}))
        return result.stdout
    def save(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    report={'sourceSha':a.artifact_source,'legacySourceSha':a.legacy_source,'group':a.group,'physicalTvTested':False,'physicalEsp32Tested':False,'actualAndroidEmulator':True,'cases':[]}
    report['androidProperties']=command(adb+['shell','getprop'])
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
            installs.append(command(adb+['install','-r',str(observer_apk)]))
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
            video_command=adb+['shell','screenrecord','--size','960x540','--bit-rate','800000','--time-limit','120',remote_video]
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
                    case['recording']={'file':'gameplay.mp4','bytes':video_file.stat().st_size,'sha256':release.digest(video_file),'method':'Android screenrecord during ordinary SDK/virtual-page inputs','maximumSeconds':120,'size':'960x540','encodingRateIsNotDevicePerformance':True}
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
    save(a.output/'report.json',report)
    assert report['status']=='passed','Some signed APKs failed actual Android controller checks'

if __name__=='__main__':main()
