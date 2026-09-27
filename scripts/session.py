#!/usr/bin/env python3
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time

runtime = Path(os.environ['LUNA_DEVKIT_RUNTIME'])
headless = '--headless' in sys.argv
children = []
handles = []


def setting(schema, key, value):
    subprocess.run(['gsettings', 'set', schema, key, value], check=True)


def cleanup():
    for child in reversed(children):
        if child.poll() is None:
            child.terminate()
    for child in reversed(children):
        try:
            child.wait(timeout=3)
        except subprocess.TimeoutExpired:
            child.kill()
            child.wait()
    for handle in handles:
        handle.close()


def interrupted(_sig, _frame):
    raise KeyboardInterrupt


signal.signal(signal.SIGTERM, interrupted)
try:
    uuids = json.loads(os.environ['LUNA_DEVKIT_UUIDS'])
    setting('org.gnome.shell', 'enabled-extensions', repr(uuids))
    setting('org.gnome.shell', 'disable-user-extensions', 'false')
    setting('org.gnome.shell', 'disable-extension-version-validation', 'false')
    setting('org.gnome.desktop.session', 'idle-delay', '0')
    setting('org.gnome.desktop.screensaver', 'lock-enabled', 'false')
    version = subprocess.check_output(['gnome-shell', '--version'], text=True).strip().split()[-1]
    setting('org.gnome.shell', 'welcome-dialog-last-shown-version', version)
    # Set the initial test backdrop once; preserve Wallpaper changes on watch restarts.
    background_marker = Path(os.environ['XDG_CONFIG_HOME']) / 'luna-devkit-background-initialized'
    if not background_marker.exists():
        setting('org.gnome.desktop.background', 'picture-options', 'none')
        setting('org.gnome.desktop.background', 'primary-color', "'#182033'")
        setting('org.gnome.desktop.background', 'picture-uri', "''")
        setting('org.gnome.desktop.background', 'picture-uri-dark', "''")
        background_marker.parent.mkdir(parents=True, exist_ok=True)
        background_marker.touch()
    if not headless:
        if not shutil.which('pipewire') or not shutil.which('wireplumber'):
            raise RuntimeError('The interactive viewer requires pipewire and wireplumber')
        for command in [['pipewire'], ['wireplumber', '--profile=policy']]:
            log = (runtime / f'{command[0]}.log').open('w')
            handles.append(log)
            child = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT)
            children.append(child)
            if command[0] == 'pipewire':
                for _ in range(50):
                    if (runtime / 'pipewire-0').exists():
                        break
                    if child.poll() is not None:
                        raise RuntimeError(f'PipeWire failed; see {runtime / "pipewire.log"}')
                    time.sleep(.1)
                else:
                    raise RuntimeError('Private PipeWire socket did not appear')
    keys = ['DBUS_SESSION_BUS_ADDRESS', 'XDG_RUNTIME_DIR', 'XDG_DATA_HOME', 'XDG_CONFIG_HOME',
            'XDG_CACHE_HOME', 'GSETTINGS_BACKEND', 'GIO_USE_VFS', 'GTK_A11Y']
    (runtime / 'environment.json').write_text(json.dumps({key: os.environ[key] for key in keys if key in os.environ}))
    command = ['gnome-shell', '--wayland', '--no-x11']
    command += sys.argv[1:] if headless else ['--devkit', '--wayland-display', 'luna-devkit']
    child = subprocess.Popen(command)
    children.append(child)
    status = child.wait()
except KeyboardInterrupt:
    status = 0
finally:
    cleanup()
sys.exit(status)
