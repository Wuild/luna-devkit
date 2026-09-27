import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

loader = importlib.machinery.SourceFileLoader('devkit', str(Path(__file__).resolve().parents[1] / 'luna-devkit'))
spec = importlib.util.spec_from_loader(loader.name, loader)
devkit = importlib.util.module_from_spec(spec)
loader.exec_module(devkit)


class DevkitTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.project = self.root / 'Example Extension'
        self.project.mkdir()
        (self.project / 'metadata.json').write_text(json.dumps({'uuid': 'example@local', 'name': 'Example'}))
        self.entry = {'path': str(self.project), 'output': 'dist', 'build': []}

    def tearDown(self):
        self.temp.cleanup()

    def test_paths_and_identity(self):
        resolved = devkit.resolve_entry(self.entry)
        self.assertEqual(resolved['source'], self.project)
        self.assertEqual(resolved['uuid'], 'example@local')
        for output in ['../escape', '/tmp/escape']:
            with self.assertRaises(ValueError):
                devkit.resolve_entry(dict(self.entry, output=output))

    def test_rejects_uuid_path_traversal_and_duplicate_uuid(self):
        with patch.object(devkit, 'registry', return_value={'extensions': [self.entry, self.entry]}):
            with self.assertRaises(ValueError):
                devkit.projects()
        (self.project / 'metadata.json').write_text(json.dumps({'uuid': '../wrong', 'name': 'Example'}))
        with self.assertRaises(ValueError):
            devkit.resolve_entry(self.entry)

    def test_isolated_environment_and_desktop(self):
        profile = self.root / 'profile'
        item = devkit.resolve_entry(self.entry)
        devkit.prepare_profile(profile, [item])
        links = profile / 'data/gnome-shell/extensions'
        self.assertTrue((links / item['uuid']).is_symlink())
        self.assertIn(str(profile / 'Desktop'), (profile / 'config/user-dirs.dirs').read_text())
        with patch.dict(os.environ, {'DBUS_SESSION_BUS_ADDRESS': 'outer-bus', 'GSETTINGS_SCHEMA_DIR': '/outer/schema'}):
            env = devkit.session_environment(profile, self.root / 'runtime', [item], True)
        self.assertNotIn('DBUS_SESSION_BUS_ADDRESS', env)
        self.assertNotIn('GSETTINGS_SCHEMA_DIR', env)
        self.assertEqual(env['XDG_DATA_HOME'], str(profile / 'data'))
        devkit.prepare_profile(profile, [])
        self.assertFalse((links / item['uuid']).is_symlink())

    def test_watcher_ignores_build_output_but_detects_sources(self):
        item = devkit.resolve_entry(self.entry)
        before = devkit.snapshot([item])
        (self.project / 'dist').mkdir()
        (self.project / 'dist/generated.js').write_text('generated')
        self.assertEqual(before, devkit.snapshot([item]))
        (self.project / 'source.ts').write_text('export {};')
        self.assertNotEqual(before, devkit.snapshot([item]))

    def test_second_start_waits_for_existing_session_cleanup(self):
        ready = threading.Event()
        cleaned = threading.Event()
        errors = []

        def existing_session():
            try:
                with devkit.session_lock(False):
                    ready.set()
                    try:
                        for _ in range(100):
                            devkit.check_restart()
                            threading.Event().wait(.01)
                        raise AssertionError('Restart was never requested')
                    finally:
                        cleaned.set()
            except Exception as error:
                errors.append(error)

        with patch.object(devkit, 'STATE', self.root):
            worker = threading.Thread(target=existing_session)
            worker.start()
            try:
                self.assertTrue(ready.wait(2))
                with devkit.session_lock(False):
                    self.assertTrue(cleaned.is_set())
                    devkit.check_restart()
            finally:
                worker.join(3)
            self.assertFalse(worker.is_alive())
            self.assertEqual(errors, [])

    def test_start_does_not_interrupt_headless_test(self):
        with patch.object(devkit, 'STATE', self.root):
            with devkit.session_lock(True):
                with self.assertRaisesRegex(ValueError, 'already running'):
                    with devkit.session_lock(False):
                        self.fail('Acquired an active test lock')
                self.assertFalse((self.root / 'restart-request').exists())

    def test_stale_restart_request_is_cleared_on_start(self):
        with patch.object(devkit, 'STATE', self.root):
            (self.root / 'restart-request').touch()
            with devkit.session_lock(False):
                devkit.check_restart()


if __name__ == '__main__':
    unittest.main()
