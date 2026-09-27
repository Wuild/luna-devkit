#!/usr/bin/env python3
"""Capture real Luna UI with a disposable profile and sample content."""
import argparse
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
loader = importlib.machinery.SourceFileLoader('luna_devkit', str(ROOT / 'luna-devkit'))
spec = importlib.util.spec_from_loader(loader.name, loader)
devkit = importlib.util.module_from_spec(spec)
loader.exec_module(devkit)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=Path('/tmp/luna-readme-screenshots'))
args = parser.parse_args()
args.output = args.output.resolve()
args.output.mkdir(parents=True, exist_ok=True)
items = [item for item in devkit.projects() if item['uuid'] in ('luna-desktop@wuild', 'luna-taskbar@wuild', 'luna-wallpaper@wuild')]
with tempfile.TemporaryDirectory(prefix='luna-readme-profile-') as temporary:
    profile = Path(temporary)
    runtime = profile / 'runtime'
    runtime.mkdir(mode=0o700)
    devkit.prepare_profile(profile, items)
    desktop = profile / 'Desktop'
    (desktop / 'Projects').mkdir()
    (desktop / 'Ideas.txt').write_text('A place for your next idea.\n')
    (desktop / 'Files.desktop').write_text('[Desktop Entry]\nType=Application\nName=Files\nIcon=org.gnome.Nautilus\nExec=nautilus\n')
    state = profile / 'data/luna-desktop/widget-state'
    state.mkdir(parents=True)
    (state / 'sticky-note.json').write_text(json.dumps({'text': 'A little space to think.\n\nPlan the week\nCollect a few ideas\nMake something useful'}))
    (state / 'quick-links.json').write_text(json.dumps({'links': [
        {'label': 'Projects', 'type': 'file', 'target': (desktop / 'Projects').as_uri()},
        {'label': 'GitHub', 'type': 'url', 'target': 'https://github.com'},
        {'label': 'GNOME', 'type': 'url', 'target': 'https://www.gnome.org'}]}))
    env = devkit.session_environment(profile, runtime, items, True)
    env['LUNA_SCREENSHOT_DIR'] = str(args.output)
    env['LANG'] = env['LC_ALL'] = 'en_US.UTF-8'
    library = next((Path(p) for p in ['/usr/lib64/gnome-shell', '/usr/lib/gnome-shell'] if (Path(p) / 'girepository-1.0').is_dir()), None)
    if library is None:
        raise SystemExit('Cannot find GNOME Shell preference libraries')
    env['LUNA_SHELL_LIBRARY_DIR'] = str(library)
    env['LUNA_SHELL_TYPELIB_DIR'] = str(library / 'girepository-1.0')
    log = args.output / 'capture.log'
    with log.open('w') as stream:
        result = subprocess.run(['dbus-run-session', '--', 'python3', str(ROOT / 'scripts/session.py'),
            '--headless', '--virtual-monitor', '1600x1000', '--automation-script', str(ROOT / 'scripts/capture-readme.js')],
            env=env, stdout=stream, stderr=subprocess.STDOUT, timeout=90)
    if result.returncode or 'LUNA_README_CAPTURE_PASS' not in log.read_text():
        raise SystemExit(f'Capture failed; see {log}')
    print(f'Screenshots saved to {args.output}')
