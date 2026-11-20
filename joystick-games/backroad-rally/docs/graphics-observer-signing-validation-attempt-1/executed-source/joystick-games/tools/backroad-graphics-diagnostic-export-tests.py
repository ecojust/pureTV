#!/usr/bin/env python3
"""Offline API/ZIP boundaries for small diagnostic evidence; no network or Git writes."""
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest import mock
import warnings
import zipfile

SPEC=importlib.util.spec_from_file_location('graphics_export',Path(__file__).with_name('backroad-graphics-diagnostic-export.py'))
m=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(m)
REQUEST={'run':12345,'attempt':1,'source':'a'*40}


def archive(entries):
    result=io.BytesIO()
    with zipfile.ZipFile(result,'w') as z:
        for name,data in entries.items():z.writestr(name,data)
    return result.getvalue()


class Fake:
    def __init__(self):
        self.run={'id':12345,'run_attempt':1,'head_sha':'a'*40,'path':m.WORKFLOW,'event':'workflow_dispatch',
                  'status':'in_progress','head_branch':'unit','repository':{'id':100,'full_name':m.REPO},
                  'head_repository':{'id':100,'full_name':m.REPO}}
        self.jobs=[];self.artifacts=[];self.zip={};self.downloads=[]
        for i,(name,(job,step)) in enumerate(m.ARTIFACTS.items(),1):
            self.jobs.append({'id':100+i,'name':job,'run_id':12345,'run_attempt':1,'head_sha':'a'*40,
                              'status':'completed','conclusion':'failure','started_at':'2026-11-19T00:00:00Z',
                              'completed_at':'2026-11-19T00:02:00Z','steps':[{'name':step,'number':10,
                              'status':'completed','conclusion':'success','started_at':'2026-11-19T00:01:00Z',
                              'completed_at':'2026-11-19T00:01:30Z'}]})
            if job=='observer':files={'observer-sign.log':b'{"status":"failed","error":"key_certificate"}\n'}
            else:files={'graphics-diagnostic/report.json':json.dumps({'game':'backroad-rally','mode':'normal',
                       'sourceCommit':'a'*40,'originalTarget':m.signer.ORIGINAL,'status':'failed','formalAcceptance':False}).encode(),
                       'graphics-diagnostic/final-system-screen.png':b'\x89PNG\r\n\x1a\nunit screenshot fixture'}
            self.zip[i]=archive(files)
            self.artifacts.append({'id':i,'name':name,'expired':False,'expires_at':'2099-01-01T00:00:00Z',
                                   'created_at':'2026-11-19T00:01:15Z','size_in_bytes':len(self.zip[i]),
                                   'digest':'sha256:'+hashlib.sha256(self.zip[i]).hexdigest(),
                                   'workflow_run':{'id':12345,'head_sha':'a'*40,'head_branch':'unit',
                                                   'repository_id':100,'head_repository_id':100}})
    def get(self,path):
        if '/actions/artifacts/' in path:return copy.deepcopy(next(a for a in self.artifacts if a['id']==int(path.rsplit('/',1)[1])))
        return copy.deepcopy(self.run)
    def pages(self,path,key):return copy.deepcopy(self.jobs if key=='jobs' else self.artifacts)
    def download(self,ident,path,size):
        self.downloads.append(ident);data=self.zip[ident];path.write_bytes(data);return len(data),hashlib.sha256(data).hexdigest()


class Boundaries(unittest.TestCase):
    def execute(self,fake):
        with tempfile.TemporaryDirectory() as t:
            output=Path(t)/'out';scratch=Path(t)/'scratch'
            # Synthetic Git-read seam only; production requires exact committed bytes.
            def git(args,**kwargs):return (m.ROOT/args[-1].split(':',1)[1]).read_bytes()
            with mock.patch.object(m.subprocess,'check_output',side_effect=git):
                result=m.execute(fake,REQUEST,output,scratch)
            self.assertFalse(any(p.suffix.lower() in ('.apk','.jks','.zip') for p in output.rglob('*')))
            self.assertTrue((output/'export-manifest.json').is_file())
            return result

    def test_original_failures_and_png_preserved_never_acceptance(self):
        f=Fake();v=self.execute(f)
        self.assertEqual(v['diagnosticStatus'],'failed');self.assertFalse(v['formalAcceptance']);self.assertFalse(v['visualAcceptance'])
        self.assertEqual(v['producerResults'],{'observer':'failure','diagnostic':'failure'})
        self.assertEqual(f.downloads,[1,2]);self.assertTrue(any(p.endswith('final-system-screen.png') for p in v['files']))

    def test_missing_skipped_runtime_explicit_success_missing_rejected(self):
        f=Fake();f.artifacts=f.artifacts[:1];f.jobs[1]['conclusion']='skipped';v=self.execute(f)
        self.assertEqual(len(v['missingArtifacts']),1);self.assertIsNone(v['diagnosticStatus'])
        f.jobs[1]['conclusion']='success'
        with self.assertRaises(Exception):self.execute(f)

    def test_source_attempt_repo_workflow_and_producer_rejected_before_download(self):
        for case in ('source','attempt','repo','workflow','job_source','job_attempt','upload'):
            f=Fake()
            if case=='source':f.run['head_sha']='f'*40
            elif case=='attempt':f.run['run_attempt']=2
            elif case=='repo':f.run['head_repository']['full_name']='other/repo'
            elif case=='workflow':f.run['path']='.github/workflows/other.yml'
            elif case=='job_source':f.jobs[0]['head_sha']='f'*40
            elif case=='job_attempt':f.jobs[0]['run_attempt']=2
            else:f.jobs[0]['steps'][0]['conclusion']='failure'
            with self.subTest(case=case),self.assertRaises(Exception):self.execute(f)
            self.assertEqual(f.downloads,[])

    def test_duplicate_expired_oversized_wrong_run_and_upload_window(self):
        for case in ('duplicate','expired','size','run','time'):
            f=Fake()
            if case=='duplicate':f.artifacts.append(copy.deepcopy(f.artifacts[0]))
            elif case=='expired':f.artifacts[0]['expired']=True
            elif case=='size':f.artifacts[0]['size_in_bytes']=m.MAX_ZIP+1
            elif case=='run':f.artifacts[0]['workflow_run']['id']=999
            else:f.artifacts[0]['created_at']='2026-11-19T00:00:15Z'
            with self.subTest(case=case),self.assertRaises(Exception):self.execute(f)
            self.assertEqual(f.downloads,[])

    def test_wrong_zip_digest_or_wrong_report_scope_not_exportable(self):
        f=Fake();f.artifacts[0]['digest']='sha256:'+'f'*64
        with self.assertRaises(Exception):self.execute(f)
        for field,value in [('formalAcceptance',True),('sourceCommit','f'*40),('mode','occupied')]:
            f=Fake();r={'game':'backroad-rally','mode':'normal','sourceCommit':'a'*40,
                        'originalTarget':m.signer.ORIGINAL,'status':'failed','formalAcceptance':False};r[field]=value
            f.zip[2]=archive({'graphics-diagnostic/report.json':json.dumps(r).encode()})
            f.artifacts[1].update(size_in_bytes=len(f.zip[2]),digest='sha256:'+hashlib.sha256(f.zip[2]).hexdigest())
            with self.subTest(field=field),self.assertRaises(Exception):self.execute(f)

    def test_forbidden_files_traversal_source_and_key_material_rejected(self):
        for name in ('target.apk','observer-signed/backroad-graphics-observer.apk','release.jks','.env',
                     'graphics-diagnostic/environment.json','graphics-diagnostic/../../outside.txt',
                     '/tmp/file','graphics-diagnostic/executed-source/tools/secret.py'):
            with self.subTest(name=name),tempfile.TemporaryDirectory() as t:
                path=Path(t)/'a.zip';path.write_bytes(archive({name:b'x'}))
                with self.assertRaises(Exception):m.unpack(path,list(m.ARTIFACTS)[1],Path(t)/'out')

    def test_duplicate_symlink_file_and_total_budgets(self):
        with tempfile.TemporaryDirectory() as t:
            path=Path(t)/'a.zip'
            with warnings.catch_warnings():
                warnings.simplefilter('ignore')
                with zipfile.ZipFile(path,'w') as z:
                    z.writestr('observer-sign.log',b'one');z.writestr('observer-sign.log',b'two')
            with self.assertRaises(Exception):m.unpack(path,list(m.ARTIFACTS)[0],Path(t)/'out')
            with zipfile.ZipFile(path,'w') as z:
                e=zipfile.ZipInfo('observer-sign.log');e.external_attr=0o120777<<16;z.writestr(e,b'/tmp/key')
            with self.assertRaises(Exception):m.unpack(path,list(m.ARTIFACTS)[0],Path(t)/'out')
            path.write_bytes(archive({'observer-sign.log':b'ab'}))
            with self.assertRaises(Exception):m.unpack(path,list(m.ARTIFACTS)[0],Path(t)/'out',m.MAX_TOTAL-1)
            with mock.patch.object(m,'MAX_FILE',1),self.assertRaises(Exception):m.unpack(path,list(m.ARTIFACTS)[0],Path(t)/'out')


if __name__=='__main__':unittest.main(verbosity=2)
