"""Optional capture of Chromium's composited page during the real input test."""
import base64
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

class Recording:
    def __init__(self, page, output):
        self.output = Path(output)
        self.scratch = TemporaryDirectory()
        self.root = Path(self.scratch.name)
        self.frames = []
        self.client = page.context.new_cdp_session(page)
        self.client.on("Page.screencastFrame", self.frame)
        self.client.send("Page.startScreencast", {
            "format":"jpeg","quality":73,"maxWidth":640,"maxHeight":360,"everyNthFrame":1,
        })

    def frame(self, event):
        self.client.send("Page.screencastFrameAck", {"sessionId":event["sessionId"]})
        timestamp = event["metadata"]["timestamp"]
        if self.frames and timestamp - self.frames[-1][0] < 1/15:
            return
        name = f"{len(self.frames):05d}.jpg"
        (self.root/name).write_bytes(base64.b64decode(event["data"]))
        self.frames.append((timestamp,name))

    def finish(self):
        self.client.send("Page.stopScreencast")
        self.client.detach()
        if len(self.frames)<3:
            raise AssertionError("Chromium captured fewer than three composited frames")
        lines = ["ffconcat version 1.0"]
        for (timestamp,name),(following,_) in zip(self.frames,self.frames[1:]):
            lines.extend([f"file {name}",f"duration {following-timestamp:.6f}"])
        lines.append("file "+self.frames[-1][1])
        (self.root/"frames.txt").write_text("\n".join(lines)+"\n")
        self.output.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(["ffmpeg","-loglevel","error","-y","-safe","1","-f","concat","-i","frames.txt",
                        "-vf","fps=12,scale=640:360","-an","-c:v","libvpx-vp9","-crf","36","-b:v","0",
                        "-row-mt","1","-cpu-used","6","-threads","2",str(self.output.resolve())],
                       cwd=self.root,check=True)
        self.scratch.cleanup()
