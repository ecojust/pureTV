"""Build and run a one-method, QA-only test with Android's built-in uiautomator runner."""
import os
from pathlib import Path
import subprocess
import tempfile

REMOTE_JAR = '/data/local/tmp/puretv-window-snapshot.jar'
REMOTE_XML = '/data/local/tmp/puretv-hosted-qa.xml'


def build_sampler(sdk, work):
    platform = sdk / 'platforms/android-35'
    android = platform / 'android.jar'
    classpath = os.pathsep.join(str(p) for p in (
        android, platform / 'uiautomator.jar', platform / 'optional/android.test.base.jar',
    ))
    subprocess.run([
        'javac', '--release', '8', '-proc:none', '-classpath', classpath, '-d', str(work),
        str(Path(__file__).with_name('WindowSnapshot.java')),
    ], check=True)
    output = work / 'window-snapshot.jar'
    subprocess.run([
        str(sdk / 'build-tools/34.0.0/d8'), '--min-api', '26', '--lib', str(android),
        '--classpath', str(platform / 'uiautomator.jar'), '--classpath', str(platform / 'optional/android.test.base.jar'),
        '--output', str(output), str(work / 'com/ecojust/tvqa/WindowSnapshot.class'),
    ], check=True)
    return output


def install_sampler(device):
    sdk = Path(os.environ.get('ANDROID_HOME') or os.environ['ANDROID_SDK_ROOT'])
    with tempfile.TemporaryDirectory(prefix='puretv-window-snapshot-') as temp:
        jar = build_sampler(sdk, Path(temp))
        device.shell('rm', '-f', REMOTE_JAR)
        device.adb('push', jar, REMOTE_JAR)
        device.shell('chmod', '0444', REMOTE_JAR)


def read_snapshot(device):
    # A missing root leaves no file. Erase the preceding tree before each sample.
    device.shell('rm', '-f', REMOTE_XML)
    device.shell('uiautomator', 'runtest', REMOTE_JAR, '-c', 'com.ecojust.tvqa.WindowSnapshot#testSnapshot')
    return device.adb('exec-out', 'cat', REMOTE_XML, binary=True)
