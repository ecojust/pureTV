#!/usr/bin/env python3
"""Compile and execute the real native URL policy; this is not a WebView/TV run."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'resource/game-kit/android/src/main/java/com/ecojust/gamekit/LocalGameUrl.java'
FIXTURE = r'''
package com.ecojust.gamekit;
public final class LocalGameUrlContract {
    private static int checks;
    private static void check(boolean condition, String detail) {
        checks++; if (!condition) throw new AssertionError(detail);
    }
    private static String repeat(char c,int n) { return new String(new char[n]).replace('\0',c); }
    public static void main(String[] args) {
        String base="https://game-kit.invalid/";
        String[] entries={"tv.html","tv.html?","tv.html?menu=title",
            "tv.html?mode=quick&stage=finland&car=swift&cond=sunset&weather=clear",
            "tv.html?mode=career&stage=wales&car=rapier&weather=rain",
            "tv.html?name=%E4%B8%AD&space=%20&encoded=%23&literal=:/?@",
            "tv.html?"+repeat('x',4096)};
        for(String suffix:entries) {
            check(LocalGameUrl.isEntry(base+suffix),"entry "+suffix);
            check("tv.html".equals(LocalGameUrl.assetPath(base+suffix)),"entry path "+suffix);
        }
        String[][] assets={{"data/menu.json?v=8d8064c1","data/menu.json"},
            {"assets/car.glb?v=3b52","assets/car.glb"},{"game.js?key=../../outside","game.js"},
            {"nested/worker/physics.js?v=aa&other=1","nested/worker/physics.js"},
            {"texture.png?encoded=%2Fetc%2Fpasswd","texture.png"}};
        for(String[] item:assets) {
            check(item[1].equals(LocalGameUrl.assetPath(base+item[0])),"query must never become file path "+item[0]);
            check(!LocalGameUrl.isEntry(base+item[0]),"resource must not become document "+item[0]);
        }
        String[] bad={null,"","http://game-kit.invalid/tv.html","https://game-kit.invalid:443/tv.html",
            "https://user@game-kit.invalid/tv.html","https://game-kit.invalid.evil/tv.html",
            "https://game-kit.invalid@evil/tv.html","https://GAME-KIT.INVALID/tv.html",
            "file:///android_asset/tv.html","content://private/tv.html","//game-kit.invalid/tv.html",
            base,base+"/tv.html",base+"../tv.html",base+"a/../tv.html",base+"a/./tv.html",
            base+"%74v.html",base+"a/%2e%2e/tv.html",base+"nested//game.js",base+"nested\\game.js",
            base+"CON",base+"a/NUL.txt",base+"x.",base+"tv.html#",base+"tv.html?x=1#fragment",
            base+"tv.html?x=%",base+"tv.html?x=%0",base+"tv.html?x=%GG",base+"tv.html?x=%00",
            base+"tv.html?x=%0a",base+"tv.html?x=%7f",base+"tv.html?x=%5C",base+"tv.html?x=\\",
            base+"tv.html?x=\n",base+"tv.html?x= ",base+"tv.html?x=中",base+"tv.html?x=[1]",
            base+"tv.html?"+repeat('x',4097),base+repeat('x',1025),base+repeat('a',1)+"/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q.js"};
        for(String url:bad) {
            check(LocalGameUrl.assetPath(url)==null,"reject malformed or nonlocal "+url);
            check(!LocalGameUrl.isEntry(url),"reject navigation "+url);
        }
        check(LocalGameUrl.assetPath(base+"unindexed.js?v=1").equals("unindexed.js"),
            "URL policy returns exact name; MainActivity must still enforce the build asset index");
        System.out.println("passed "+checks+" actual Java URL policy checks");
    }
}
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--jdk', type=Path, default=Path(os.environ.get('JAVA_HOME', '/usr/lib/jvm/default-java')))
    args = parser.parse_args()
    before = SOURCE.read_bytes()
    with tempfile.TemporaryDirectory(prefix='android-url-contract-') as temporary:
        out = Path(temporary); fixture = out / 'LocalGameUrlContract.java'; fixture.write_text(FIXTURE)
        subprocess.run([str(args.jdk / 'bin/javac'), '-encoding', 'UTF-8', '-source', '8', '-target', '8',
                        '-d', str(out), str(SOURCE), str(fixture)], check=True)
        result = subprocess.check_output([str(args.jdk / 'bin/java'), '-cp', str(out),
                                          'com.ecojust.gamekit.LocalGameUrlContract'], text=True)
        assert result.startswith('passed ') and 'actual Java URL policy checks' in result
    assert SOURCE.read_bytes() == before
    print(json.dumps({'scope': __doc__, 'source': str(SOURCE.relative_to(ROOT)),
                      'sourceSha256': hashlib.sha256(before).hexdigest(),
                      'fixtureSha256': hashlib.sha256(FIXTURE.encode()).hexdigest(), 'result': result.strip(),
                      'actualWebViewTested': False, 'physicalTvTested': False}))


if __name__ == '__main__': main()
