#!/usr/bin/env python3
"""Write a reviewable README proposal outside the repo; never apply it."""
import argparse,pathlib,re
from release_lib import config,gitbytes,require
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--config',type=pathlib.Path,default=pathlib.Path(__file__).with_name('release-config.json'));p.add_argument('--game',required=True);p.add_argument('--output',required=True,type=pathlib.Path);a=p.parse_args();c=config(a.config,a.game);require(not a.output.resolve().is_relative_to(c['repo']),'Proposal must be outside repository');require(not a.output.exists(),'Do not overwrite an existing proposal')
text=gitbytes(c,c['sourceCommit'],f'resource/apps/{a.game}/README.md').decode();title,body=text.split('\n',1);old=c['previousVersion'];version=c['version'];slug=a.game
body=re.sub(r'^'+re.escape(old)+r'：[\s\S]*?$',lambda m:'历史 '+m.group(0).replace('(docs/verification.json)',f'(docs/verification-{old}.json)'),body,count=1,flags=re.M)
body=body.replace('本版共六关，新增三关。浏览器普通输入验证已完成；尚未进行实体电视或手机测试。\n\n','',1)
body=re.sub(r'^当前下载为[^\n]*(?:待发布|待验证)[^\n]*(?:\n|$)','',body,flags=re.M)
body=body.replace(f'![{old} 实际游戏画面](thumb.png)\n\n','',1)
body=re.sub(r'^- (?:源码)?版本：`[^`]+`(?:（versionCode \d+）)?',f'- 版本：`{version}`（versionCode {c["game"]["versionCode"]}）',body,flags=re.M)
body=body.replace(f'{old} 的安装包、预览和实际浏览器记录见上方下载区',f'{old} 的安装包、预览和实际浏览器记录见历史下载链接')
body=re.sub(r'^- 当前发布：[^\n]*',f'- 版本：`{version}`（versionCode {c["game"]["versionCode"]}）',body,flags=re.M)
body=body.replace(f'上方下载和录像仍为已发布的 {old}，旧版验证证据保留。',f'上方下载和录像已更新为 {version}；{old} 原版与验证证据保留在历史链接中。')
history=f'历史 {old}：[安装包]({slug}-{old}.apk) · [录像](docs/gameplay-{old}.mp4) · [验证记录](docs/verification-{old}.json)'
if f'{slug}-{old}.apk' not in body:body='\n'+history+'\n'+body
block=f'{version}：[签名安装包]({slug}-{version}.apk) · [六关实际游玩录像](docs/gameplay-{version}.mp4) · [验证记录](docs/verification.json)\n\n{c["game"]["patchNoteZh"]}本次为修正版，共六关，未增加关卡。普通输入与签名产物验证见发布记录；尚未进行实体电视或手机测试。\n\n![{version} 实际游戏画面](thumb.png)'
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(title+'\n\n'+block+'\n'+body);print(a.output)
