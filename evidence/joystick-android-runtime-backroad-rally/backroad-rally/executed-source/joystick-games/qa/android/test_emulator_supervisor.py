#!/usr/bin/env python3
"""Real small ELF/process fixtures only. These are not actual emulator acceptance."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import textwrap
import time
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
MODULE = ROOT / 'joystick-games/tools/android-emulator-supervisor.py'
spec = importlib.util.spec_from_file_location('supervisor', MODULE)
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

FIXTURE = r'''
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
int main(int argc,char **argv) {
 if(argc==2 && !strcmp(argv[1],"-version")) {
  puts("Android emulator version 37.3.10.0 (build_id 16970787)");
  fputs("fixture version stderr\n",stderr);return 0;
 }
 const char *mode=getenv("PURETV_SUPERVISOR_FIXTURE");if(!mode)mode="zero";
 const char *marker=getenv("PURETV_SUPERVISOR_MARKER");
 if(marker){FILE *f=fopen(marker,"w");fprintf(f,"%d",getpid());fclose(f);}
 if(!strcmp(mode,"exec")) {
  const char *target=getenv("PURETV_SUPERVISOR_EXEC_TARGET");setenv("PURETV_SUPERVISOR_FIXTURE","nonzero",1);execv(target,argv);return 99;
 }
 if(!strcmp(mode,"fork")){if(fork()==0){usleep(200000);return 0;}return 0;}
 if(!strcmp(mode,"signal9")){raise(SIGKILL);return 99;}
 if(!strcmp(mode,"signal15")){raise(SIGTERM);return 99;}
 if(!strcmp(mode,"ignore")){signal(SIGTERM,SIG_IGN);for(;;)pause();}
 if(!strcmp(mode,"hang")){for(;;)pause();}
 if(!strcmp(mode,"output")){for(int i=0;i<1500000;i++){putchar('x');fputc('y',stderr);}return 27;}
 printf("argv0=%s\n",argv[0]);for(int i=1;i<argc;i++)printf("arg%d=%s\n",i,argv[i]);fflush(stdout);
 usleep(150000);return !strcmp(mode,"nonzero")?23:0;
}
'''


class SupervisorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.shared = tempfile.TemporaryDirectory(prefix='emulator-supervisor-elf-')
        cls.binary = Path(cls.shared.name) / 'fixture'
        subprocess.run(['cc', '-x', 'c', '-', '-o', str(cls.binary)], input=FIXTURE.encode(), check=True, capture_output=True)

    @classmethod
    def tearDownClass(cls):
        cls.shared.cleanup()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='emulator-supervisor-tests-')
        self.root = Path(self.temp.name); self.sdk = self.root / 'sdk'; self.entry = self.sdk / 'emulator/emulator'
        self.entry.parent.mkdir(parents=True); shutil.copyfile(self.binary, self.entry); self.entry.chmod(0o755)
        self.original = self.entry.read_bytes(); self.output = self.root / 'observation'
        self.env = {'SUPERVISE_PON_EMULATOR': 'true', 'PURETV_DISPOSABLE_EMULATOR': '1', 'GITHUB_ACTIONS': 'true',
                    'PON_DISABLE_VULKAN': 'false', 'PON_CAPTURE_QEMU_STACK': 'false',
                    'GAME': 'ponpoko-kart', 'ARTIFACT_SOURCE': '8f283c73f52f857777306eafc88f710262367834',
                    'ARTIFACT_RUN': '44597115244', 'ARTIFACT_EXPORT': '4249f5c0ec3053a1dec652a7880a040e1bb143f0',
                    'ARTIFACT_ID': '', 'ARTIFACT_ATTEMPT': '', 'GITHUB_SHA': 'a' * 40, 'GITHUB_RUN_ID': '123',
                    'GITHUB_RUN_ATTEMPT': '1', 'ANDROID_HOME': str(self.sdk)}
        self.patch = patch.dict(os.environ, self.env); self.patch.start()

    def tearDown(self):
        self.patch.stop(); self.temp.cleanup()

    def prepared(self):
        return m.prepare(self.sdk, self.output)

    def wait_owned_launch(self, process, marker):
        # An ELF marker can precede the supervisor's ownership record.
        # Restore can stop the owned process only after both identities exist.
        until = time.monotonic()+5; last = None
        while time.monotonic()<until:
            try:
                last = json.loads((self.output/'launch/report.json').read_text())
                if (marker.exists() and last.get('status') == 'running'
                        and last.get('supervisor', {}).get('pid') == process.pid
                        and last.get('child', {}).get('pid') == int(marker.read_text())
                        and type(last['child'].get('starttimeTicks')) is int):
                    return last
            except (OSError, ValueError):
                pass
            self.assertIsNone(process.poll(), 'Fixture supervisor quit before ownership was published')
            time.sleep(.02)
        self.fail('Fixture did not publish its owned launch record within the original 5-second setup budget: '+str(last))

    def test_default_off_and_wrong_identity_never_touch_sdk(self):
        with patch.dict(os.environ, {'SUPERVISE_PON_EMULATOR': 'false'}):
            result = subprocess.run([sys.executable, str(MODULE), 'prepare', '--sdk', str(self.sdk), '--output', str(self.output)], capture_output=True)
        self.assertEqual(result.returncode, 0); self.assertFalse(self.output.exists()); self.assertEqual(self.entry.read_bytes(), self.original)
        for key, value in [('GAME', 'other'), ('ARTIFACT_SOURCE', 'b' * 40), ('ARTIFACT_RUN', '4'), ('ARTIFACT_EXPORT', 'c' * 40), ('ARTIFACT_ID', '1')]:
            with patch.dict(os.environ, {key: value}):
                with self.assertRaises(AssertionError): m.enabled()

    def test_actual_workflow_selector_rejects_other_games_sources_and_origins(self):
        workflow = (ROOT/'.github/workflows/joystick-catalog-android-runtime.yml').read_text()
        start = workflow.index("          assert os.environ['SUPERVISE_PON_EMULATOR']")
        end = workflow.index('          out=Path(', start)
        guard = compile(textwrap.dedent(workflow[start:end]), '<actual-workflow-supervisor-guard>', 'exec')
        with patch.dict(os.environ, {'GAMES': 'ponpoko-kart', 'BATCH': 'racing-01', 'CONFIRM_BACKROAD_INSTALL': 'false'}):
            exec(guard, {'os': os})
            for key, value in [('GAMES', 'ponpoko-kart,night-racer'), ('BATCH', 'racing-02'),
                               ('ARTIFACT_SOURCE', 'a'*40), ('ARTIFACT_RUN', '42'), ('ARTIFACT_ID', '123'),
                               ('ARTIFACT_EXPORT', 'b'*40), ('ARTIFACT_ATTEMPT', '1'), ('CONFIRM_BACKROAD_INSTALL', 'true')]:
                with patch.dict(os.environ, {key: value}):
                    with self.assertRaises(AssertionError, msg=key): exec(guard, {'os': os})

    def test_vulkan_flag_defaults_off_and_requires_supervised_exact_original(self):
        environment = dict(self.env); environment.pop('PON_DISABLE_VULKAN')
        self.assertFalse(m.disable_vulkan(environment))
        self.assertEqual(m.expected_arguments(environment), m.EXPECTED_ARGS)
        environment['PON_DISABLE_VULKAN'] = 'true'
        self.assertEqual(m.expected_arguments(environment), m.EXPECTED_ARGS + ['-feature', '-Vulkan'])
        for key, value in [('SUPERVISE_PON_EMULATOR', 'false'), ('GAME', 'night-racer'),
                           ('ARTIFACT_SOURCE', 'b'*40), ('ARTIFACT_RUN', '1'),
                           ('ARTIFACT_EXPORT', 'c'*40), ('ARTIFACT_ID', '1')]:
            with self.assertRaises(AssertionError, msg=key): m.expected_arguments(dict(environment, **{key: value}))
        for value in ['', 'TRUE', '1', '-feature -Vulkan']:
            with self.assertRaises(AssertionError): m.enabled(dict(environment, PON_DISABLE_VULKAN=value))
        with patch.dict(os.environ, {'SUPERVISE_PON_EMULATOR': 'false', 'PON_DISABLE_VULKAN': 'true'}):
            result = subprocess.run([sys.executable, str(MODULE), 'prepare', '--sdk', str(self.sdk), '--output', str(self.output)], capture_output=True)
        self.assertNotEqual(result.returncode, 0); self.assertFalse(self.output.exists())
        self.assertEqual(self.entry.read_bytes(), self.original)

    def test_stack_flag_is_default_off_exact_scope_and_never_changes_argv(self):
        environment = dict(self.env); environment.pop('PON_CAPTURE_QEMU_STACK')
        self.assertFalse(m.capture_stack(environment))
        environment.update(PON_CAPTURE_QEMU_STACK='true', PON_DISABLE_VULKAN='true')
        self.assertTrue(m.capture_stack(environment))
        self.assertEqual(m.expected_arguments(environment), m.EXPECTED_ARGS + ['-feature', '-Vulkan'])
        for key, value in [('SUPERVISE_PON_EMULATOR', 'false'), ('PON_DISABLE_VULKAN', 'false'),
                           ('GAME', 'night-racer'), ('ARTIFACT_SOURCE', 'b'*40), ('ARTIFACT_RUN', '1'),
                           ('ARTIFACT_EXPORT', 'c'*40), ('ARTIFACT_ID', '1'), ('PON_CAPTURE_QEMU_STACK', '1')]:
            with self.subTest(key=key), self.assertRaises(AssertionError):
                m.capture_stack(dict(environment, **{key: value}))
        helper = m.stack_module(MODULE.with_name('android-qemu-stack.py'))
        environment['RUNNER_TEMP'] = str(self.root / 'runner-temp-without-gate')
        with patch.dict(os.environ, environment), patch.object(m, 'stack_module', return_value=helper):
            with self.assertRaisesRegex(helper.Rejected, '^Missing bounded permission gate$'):
                m.prepare(self.sdk, self.output)
        self.assertEqual(self.entry.read_bytes(), self.original)
        self.assertFalse(self.entry.with_name(m.BACKUP_NAME).exists())

    def test_stack_workflow_selector_and_non_acceptance_are_explicit(self):
        workflow = (ROOT/'.github/workflows/joystick-catalog-android-runtime.yml').read_text()
        start = workflow.index("          assert os.environ['SUPERVISE_PON_EMULATOR']")
        guard = compile(textwrap.dedent(workflow[start:workflow.index('          out=Path(', start)]), '<workflow-stack-guard>', 'exec')
        with patch.dict(os.environ, {'PON_CAPTURE_QEMU_STACK':'true','PON_DISABLE_VULKAN':'true',
                                    'GAMES':'ponpoko-kart','BATCH':'racing-01','CONFIRM_BACKROAD_INSTALL':'false'}):
            exec(guard, {'os':os})
            for key, value in [('PON_DISABLE_VULKAN','false'),('SUPERVISE_PON_EMULATOR','false'),
                               ('GAMES','night-racer'),('ARTIFACT_SOURCE','a'*40),('PON_CAPTURE_QEMU_STACK','TRUE')]:
                with patch.dict(os.environ,{key:value}), self.assertRaises(AssertionError):
                    exec(guard, {'os':os})
        begin=workflow.index('          original_checks_passed=')
        end=workflow.index("          (out/'runtime-verification.json')",begin)
        source=compile(textwrap.dedent(workflow[begin:end]),'<actual-export-acceptance>','exec')
        for enabled in ['false','true']:
            with patch.dict(os.environ,{'PON_CAPTURE_QEMU_STACK':enabled,'RUNTIME_RESULT':'success'}):
                scope={'errors':[],'archive':{'status':'passed'},'os':os};exec(source,scope)
                self.assertTrue(scope['original_checks_passed'])
                self.assertEqual(scope['accepted'],enabled=='false')
        self.assertLess(workflow.index('name: Require actual same-user'),workflow.index('uses: reactivecircus/'))

    def test_actual_workflow_vulkan_scope_and_only_two_added_argument_tokens(self):
        workflow = (ROOT/'.github/workflows/joystick-catalog-android-runtime.yml').read_text()
        start = workflow.index("          assert os.environ['SUPERVISE_PON_EMULATOR']")
        guard = compile(textwrap.dedent(workflow[start:workflow.index('          out=Path(', start)]), '<workflow-vulkan-guard>', 'exec')
        with patch.dict(os.environ, {'PON_DISABLE_VULKAN': 'true', 'GAMES': 'ponpoko-kart',
                                    'BATCH': 'racing-01', 'CONFIRM_BACKROAD_INSTALL': 'false'}):
            exec(guard, {'os': os})
            for key, value in [('SUPERVISE_PON_EMULATOR', 'false'), ('GAMES', 'night-racer'),
                               ('GAMES', 'ponpoko-kart,night-racer'), ('BATCH', 'racing-02'),
                               ('ARTIFACT_SOURCE', 'b'*40), ('ARTIFACT_RUN', '1'),
                               ('ARTIFACT_EXPORT', 'c'*40), ('ARTIFACT_ID', '1'),
                               ('ARTIFACT_ATTEMPT', '1'), ('CONFIRM_BACKROAD_INSTALL', 'true'),
                               ('PON_DISABLE_VULKAN', '1')]:
                with patch.dict(os.environ, {key: value}):
                    with self.assertRaises(AssertionError, msg=key): exec(guard, {'os': os})
        options = next(line.strip().removeprefix('emulator-options: ') for line in workflow.splitlines()
                       if line.strip().startswith('emulator-options: '))
        selection = "${{ inputs.pon_disable_vulkan && ' -feature -Vulkan' || '' }}"
        self.assertEqual(options.count(selection), 1)
        prefix = ['-port', '5554', '-avd', 'JoystickGamesValidation']
        backroad_driver = "${{ matrix.game == 'backroad-rally' && 'lavapipe' || 'swiftshader_indirect' }}"
        self.assertEqual(options.count(backroad_driver), 1)
        rally_args = prefix + options.replace(backroad_driver, 'lavapipe').replace(selection, '').split()
        expected_rally = list(m.EXPECTED_ARGS)
        expected_rally[expected_rally.index('-gpu') + 1] = 'lavapipe'
        self.assertEqual(rally_args, expected_rally)
        options = options.replace(backroad_driver, 'swiftshader_indirect')
        self.assertEqual(prefix + options.replace(selection, '').split(), m.EXPECTED_ARGS)
        self.assertEqual(prefix + options.replace(selection, ' -feature -Vulkan').split(),
                         m.EXPECTED_ARGS + ['-feature', '-Vulkan'])
        self.assertIn("emulator-build: '16970787'", workflow); self.assertIn('api-level: 36', workflow)
        declared = workflow.split('      pon_disable_vulkan:', 1)[1].split('\n\nconcurrency:', 1)[0]
        self.assertIn('default: false', declared); self.assertIn('type: boolean', declared)

    def test_atomic_install_queries_match_and_finally_restores_exact_original(self):
        state = self.prepared()
        try:
            self.assertEqual(state['status'], 'verified'); self.assertTrue(state['queriesIdentical'])
            self.assertFalse(state['disableVulkan']); self.assertEqual(state['expectedArguments'], m.EXPECTED_ARGS)
            self.assertEqual(Path(state['backup']).read_bytes(), self.original)
            self.assertNotEqual(self.entry.read_bytes(), self.original)
            m.assert_ready(self.output)
            for name in ['stdout.log', 'stderr.log']:
                self.assertEqual((self.output/'original-query'/name).read_bytes(), (self.output/'wrapped-query'/name).read_bytes())
            self.assertFalse(self.entry.with_name(m.SHIM_NAME).exists())
        finally: m.restore(self.output)
        self.assertEqual(self.entry.read_bytes(), self.original); self.assertEqual(self.entry.stat().st_mode & 0o777, 0o755)
        self.assertFalse(Path(state['backup']).exists()); self.assertTrue(m.restore(self.output)['restored'])

    def test_install_replace_failure_recovers_original_and_removes_backup(self):
        actual_replace = os.replace
        def fail_entry(source, target):
            if Path(target) == self.entry: raise PermissionError('fixture install failure')
            return actual_replace(source, target)
        with patch.object(m.os, 'replace', side_effect=fail_entry):
            with self.assertRaises(PermissionError): self.prepared()
        self.assertEqual(self.entry.read_bytes(), self.original)
        self.assertFalse(self.entry.with_name(m.BACKUP_NAME).exists()); self.assertFalse(self.entry.with_name(m.SHIM_NAME).exists())
        self.assertTrue(json.loads((self.output/'state.json').read_text())['restored'])

    def test_state_write_failure_after_install_also_restores_original(self):
        actual = m.atomic_json; failed = []
        def fail_once(path, value):
            if value.get('status') == 'checking-wrapper' and not failed:
                failed.append(True); raise OSError('fixture state write failure')
            return actual(path, value)
        with patch.object(m, 'atomic_json', side_effect=fail_once):
            with self.assertRaises(OSError): self.prepared()
        self.assertEqual(self.entry.read_bytes(), self.original)
        self.assertFalse(self.entry.with_name(m.BACKUP_NAME).exists())
        self.assertTrue(json.loads((self.output/'state.json').read_text())['restored'])

    def test_wrapper_query_mismatch_aborts_and_restores_before_qa(self):
        original_query = m.query
        def changed_query(entry, output):
            result = original_query(entry, output)
            if output.name == 'wrapped-query': (output/'stdout.log').write_bytes(b'wrong version\n')
            return result
        with patch.object(m, 'query', side_effect=changed_query):
            with self.assertRaisesRegex(AssertionError, 'Wrapped version query differs'): self.prepared()
        self.assertEqual(self.entry.read_bytes(), self.original)
        with self.assertRaises(AssertionError): m.assert_ready(self.output)
        self.assertFalse((self.output/'launch').exists())

    def test_wrapper_query_exit_stderr_and_budget_mismatches_also_restore(self):
        original_query = m.query
        for change in ['exit', 'stderr', 'budget']:
            self.output = self.root / change
            def changed_query(entry, output):
                result = original_query(entry, output)
                if output.name == 'wrapped-query':
                    if change == 'exit': result['returnCode'] = 3
                    elif change == 'stderr': (output/'stderr.log').write_bytes(b'different stderr\n')
                    else: result['outputTruncated']['stdout'] = True
                return result
            with patch.object(m, 'query', side_effect=changed_query):
                with self.assertRaises(AssertionError): self.prepared()
            self.assertEqual(self.entry.read_bytes(), self.original)
            self.assertTrue(json.loads((self.output/'state.json').read_text())['restored'])
            self.assertFalse((self.output/'launch').exists())

    def test_existing_shim_or_backup_is_rejected_without_overwrite(self):
        self.prepared()
        with self.assertRaisesRegex(AssertionError, 'Existing supervisor'): m.prepare(self.sdk, self.root/'second')
        m.restore(self.output)
        self.entry.with_name(m.BACKUP_NAME).write_bytes(b'unrelated')
        with self.assertRaisesRegex(AssertionError, 'Existing supervisor'): m.prepare(self.sdk, self.root/'third')
        self.assertEqual(self.entry.with_name(m.BACKUP_NAME).read_bytes(), b'unrelated')

    def test_restore_refuses_changed_entry_instead_of_overwriting_it(self):
        state = self.prepared(); self.entry.write_bytes(b'unrelated change')
        with self.assertRaisesRegex(AssertionError, 'unexpected SDK entry'): m.restore(self.output)
        self.assertEqual(self.entry.read_bytes(), b'unrelated change'); self.assertEqual(Path(state['backup']).read_bytes(), self.original)

    def test_exact_argv_queries_direct_and_unknown_avd_flags_rejected(self):
        self.prepared()
        try:
            os.environ['PURETV_SUPERVISOR_FIXTURE'] = 'zero'
            result = subprocess.run([str(self.entry), *m.EXPECTED_ARGS], capture_output=True, timeout=5)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads((self.output/'launch/report.json').read_text())
            self.assertEqual(report['argv0'], str(self.entry)); self.assertEqual(report['arguments'], m.EXPECTED_ARGS)
            lines = (self.output/'launch/stdout.log').read_text().splitlines()
            self.assertEqual(lines, ['argv0='+str(self.entry)] + ['arg'+str(i+1)+'='+arg for i,arg in enumerate(m.EXPECTED_ARGS)])
            self.assertEqual(result.stdout, (self.output/'launch/stdout.log').read_bytes())
            self.assertTrue(report['originalActionOutputForwarding'])
            self.assertEqual(report['returnCode'], 0); self.assertFalse(report['actualQemuExitProven'])
            bad = subprocess.run([str(self.entry), *m.EXPECTED_ARGS, '-show-kernel'], capture_output=True, timeout=5)
            self.assertNotEqual(bad.returncode, 0)
            alias = subprocess.run([str(self.entry), '@OtherAvd'], capture_output=True, timeout=5)
            self.assertNotEqual(alias.returncode, 0)
        finally: m.restore(self.output)

    def test_vulkan_comparison_real_child_receives_only_exact_selected_argv(self):
        with patch.dict(os.environ, {'PON_DISABLE_VULKAN': 'true'}):
            state = self.prepared()
            try:
                expected = m.EXPECTED_ARGS + ['-feature', '-Vulkan']
                self.assertTrue(state['disableVulkan']); self.assertEqual(state['expectedArguments'], expected)
                result = subprocess.run([str(self.entry), *expected], capture_output=True, timeout=5)
                self.assertEqual(result.returncode, 0, result.stderr)
                report = json.loads((self.output/'launch/report.json').read_text())
                self.assertEqual(report['arguments'], expected); self.assertIsNone(report['intervention'])
                self.assertFalse(report['rootCauseProven'])
                self.assertEqual((self.output/'launch/stdout.log').read_text().splitlines(),
                                 ['argv0='+str(self.entry)] + ['arg'+str(i+1)+'='+arg for i,arg in enumerate(expected)])
                for wrong in [m.EXPECTED_ARGS, expected + ['-feature', '-Vulkan'],
                              m.EXPECTED_ARGS + ['-feature', 'Vulkan'], expected + ['-memory', '3072']]:
                    failed = subprocess.run([str(self.entry), *wrong], capture_output=True, timeout=5)
                    self.assertNotEqual(failed.returncode, 0)
                    self.assertIn(b'Unexpected supervised emulator arguments', failed.stderr)
            finally: m.restore(self.output)
        self.assertEqual(self.entry.read_bytes(), self.original)

    def test_vulkan_selection_or_prepared_arguments_cannot_drift_before_launch(self):
        self.prepared()
        try:
            with patch.dict(os.environ, {'PON_DISABLE_VULKAN': 'true'}):
                with self.assertRaisesRegex(AssertionError, 'selection changed'): m.assert_ready(self.output)
            state = json.loads((self.output/'state.json').read_text())
            state['expectedArguments'] += ['-feature', '-Vulkan']
            (self.output/'state.json').write_text(json.dumps(state))
            with self.assertRaisesRegex(AssertionError, 'prepared emulator arguments'): m.assert_ready(self.output)
            self.assertFalse((self.output/'launch').exists())
        finally: m.restore(self.output)

    def child_case(self, name, mode, seconds=2, budget=4096):
        with patch.dict(os.environ, {'PURETV_SUPERVISOR_FIXTURE': mode}):
            return m.run_child([str(self.entry), *m.EXPECTED_ARGS], self.entry, self.root/name,
                               sdk=self.sdk, seconds=seconds, budget=budget)

    def test_real_nonzero_sigkill_sigterm_and_bounded_logs(self):
        for mode, code in [('nonzero', 23), ('signal9', -9), ('signal15', -15), ('output', 27)]:
            result = self.child_case(mode, mode)
            self.assertEqual(result['returnCode'], code); self.assertIsNone(result['intervention'])
            self.assertTrue(result['originalExecutableUnchanged'])
            self.assertTrue(all(value <= 4096 for value in result['bytesRetained'].values()))
        self.assertEqual(result['bytesRead'], {'stdout': 1500000, 'stderr': 1500000})
        self.assertEqual(result['outputTruncated'], {'stdout': True, 'stderr': True})

    def test_deadline_escalation_is_explicit_and_leaves_no_owned_child(self):
        result = self.child_case('deadline', 'ignore', seconds=.1)
        self.assertEqual(result['returnCode'], -9)
        self.assertEqual(result['intervention'], 'supervisor-deadline')
        self.assertLess(result['elapsedSeconds'], 6)
        with self.assertRaises(ProcessLookupError): os.kill(result['child']['pid'], 0)

    def test_same_pid_qemu_exec_is_bound_but_forked_launcher_exit_is_unknown(self):
        qemu = self.sdk/'emulator/qemu/linux-x86_64/qemu-system-x86_64-headless'; qemu.parent.mkdir(parents=True)
        shutil.copyfile(self.entry, qemu); qemu.chmod(0o755)
        with patch.dict(os.environ, {'PURETV_SUPERVISOR_EXEC_TARGET': str(qemu)}): result = self.child_case('exec', 'exec')
        self.assertEqual(result['returnCode'], 23); self.assertTrue(result['actualQemuExitProven']); self.assertEqual(result['qemuExitCode'], 23)
        fork = self.child_case('fork', 'fork')
        self.assertEqual(fork['returnCode'], 0); self.assertFalse(fork['actualQemuExitProven']); self.assertIsNone(fork['qemuExitCode'])

    def test_signal_to_supervisor_cleans_owned_child_and_restore_succeeds(self):
        self.prepared(); marker = self.root/'child.pid'
        env = dict(os.environ, PURETV_SUPERVISOR_FIXTURE='hang', PURETV_SUPERVISOR_MARKER=str(marker))
        child = subprocess.Popen([str(self.entry), *m.EXPECTED_ARGS], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            until = time.monotonic()+5
            while not marker.exists() and time.monotonic()<until: time.sleep(.02)
            self.assertTrue(marker.exists()); pid = int(marker.read_text())
            child.send_signal(signal.SIGTERM); stdout, stderr = child.communicate(timeout=8)
            self.assertEqual(child.returncode, 143, (stdout, stderr))
            result = json.loads((self.output/'launch/report.json').read_text())
            self.assertEqual(result['receivedSignal'], 15); self.assertEqual(result['returnCode'], -15)
            self.assertEqual(result['intervention'], 'supervisor-signal')
            with self.assertRaises(ProcessLookupError): os.kill(pid, 0)
        finally:
            if child.poll() is None: child.kill(); child.communicate(timeout=3)
            m.restore(self.output)
        self.assertEqual(self.entry.read_bytes(), self.original)

    def test_restore_finishes_running_owned_supervisor(self):
        self.prepared(); marker = self.root/'restore-child.pid'
        child = subprocess.Popen([str(self.entry), *m.EXPECTED_ARGS], env=dict(os.environ,
            PURETV_SUPERVISOR_FIXTURE='hang', PURETV_SUPERVISOR_MARKER=str(marker)), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            self.wait_owned_launch(child, marker)
            m.restore(self.output); child.communicate(timeout=8)
            self.assertEqual(self.entry.read_bytes(), self.original)
            self.assertTrue(json.loads((self.output/'state.json').read_text())['cleanupSignalledOwnedSupervisor'])
        finally:
            if child.poll() is None: child.kill(); child.communicate(timeout=3)

    def test_restore_fixture_waits_for_report_when_child_marker_wins_the_race(self):
        self.prepared(); marker = self.root/'early-child.pid'; release = self.root/'publish-report'
        # Delay only this fixture's first report after its real ELF starts.
        # The production timeout and restore implementation remain unchanged.
        driver = '''import importlib.util,sys,time
from pathlib import Path
spec=importlib.util.spec_from_file_location('fixture_supervisor',sys.argv[1])
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
out,release=map(Path,sys.argv[2:]);original=m.atomic_json
def controlled(path,value):
 if Path(path)==out/'launch/report.json' and value.get('status')=='running':
  deadline=time.monotonic()+5
  while not release.exists() and time.monotonic()<deadline:time.sleep(.01)
  assert release.exists(),'Fixture publication barrier was not released'
 return original(path,value)
m.atomic_json=controlled
sys.exit(m.launch(out,m.expected_arguments()))
'''
        child = subprocess.Popen([sys.executable, '-c', driver, str(MODULE), str(self.output), str(release)],
            env=dict(os.environ, PURETV_SUPERVISOR_FIXTURE='hang', PURETV_SUPERVISOR_MARKER=str(marker)),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            until=time.monotonic()+5
            while not marker.exists() and time.monotonic()<until: time.sleep(.02)
            self.assertTrue(marker.exists())
            self.assertFalse((self.output/'launch/report.json').exists(), 'Controlled marker-before-report window was not reproduced')
            self.assertIsNone(child.poll())
            release.write_text('publish')
            self.wait_owned_launch(child, marker)
            state=m.restore(self.output); stdout,stderr=child.communicate(timeout=8)
            self.assertTrue(state['cleanupSignalledOwnedSupervisor'])
            self.assertEqual(child.returncode,143,(stdout,stderr))
            self.assertEqual(self.entry.read_bytes(),self.original)
            self.assertEqual(json.loads((self.output/'launch/report.json').read_text())['returnCode'],-15)
        finally:
            release.touch()
            if child.poll() is None:
                child.terminate()
                try: child.communicate(timeout=8)
                except subprocess.TimeoutExpired: child.kill(); child.communicate(timeout=3)


if __name__ == '__main__': unittest.main(verbosity=2)
