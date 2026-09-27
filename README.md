# Luna Devkit

**A playground for your GNOME desktop.**

Try Luna’s taskbar, widgets, and wallpaper tools together in a separate desktop window. Tweak the code, watch the session restart, and keep your everyday desktop out of the experiment.

![Luna Desktop widgets and Luna Taskbar running together in a test session](docs/screenshots/luna-session.png)

*Real UI captured with a disposable profile and sample content. The widgets come from Luna Desktop; the bar comes from Luna Taskbar.*

## Try ideas without rearranging your desktop

- **One place for the whole setup.** Build and run Taskbar, Desktop, and Wallpaper together.
- **Edit and see it.** Watch mode rebuilds and restarts when source files change.
- **Keep your experiments.** The interactive session remembers its own settings, wallpaper, widget content, and test files.
- **Add your own extension.** Link another project with one command.
- **Test multiple displays.** Run the headless integration suite with one or more virtual monitors.
- **Take real screenshots.** The included capture script sets up sample content in a fresh profile for documentation.

## Get started

Requires GNOME Shell 50 on Wayland, the matching distro `mutter-devkit`, GJS, Python 3, D-Bus/GLib tools, PipeWire, and WirePlumber. Building Taskbar and Desktop also needs Node.js 22+ and pnpm.

Clone the projects into sibling folders:

```sh
mkdir luna && cd luna
git clone https://github.com/Wuild/luna-taskbar.git "Luna - Taskbar"
git clone https://github.com/Wuild/luna-desktop.git "Luna - Desktop"
git clone https://github.com/Wuild/luna-wallpaper.git "Luna - Wallpaper"
git clone https://github.com/Wuild/luna-devkit.git "Luna - Devkit"
(cd "Luna - Taskbar" && pnpm install --frozen-lockfile)
(cd "Luna - Desktop" && pnpm install --frozen-lockfile)
cd "Luna - Devkit"
./luna-devkit doctor
./luna-devkit start --watch
```

The dev window enables **Input → Inhibit system shortcuts** at startup, so keyboard shortcuts go to the virtual desktop while it is focused. You can turn this off in the window’s Input menu.

Each start builds the linked projects and opens the viewer. Close it or press Ctrl+C to stop. Starting again shuts down the previous interactive session cleanly. An active headless test is not interrupted.

The session restarts fully when sources change; the private profile survives. If a build fails, watch mode waits for your next edit and retries.

## Make it your own

```sh
./luna-devkit list
./luna-devkit link "../My Extension"
./luna-devkit unlink example@local
./luna-devkit build
```

Projects need `metadata.json` with a unique UUID. The default build is `pnpm build`, with output in `dist/`. Use `--output . --no-build` for a ready-to-run JavaScript extension.

The shared `extensions.json` links the three Luna extensions. For machine-specific paths or optional extensions, copy it to `extensions.local.json`; that ignored file takes precedence. For example, you can link an independently installed ArcMenu in your local configuration. It is not bundled or required.

## Open apps and settings inside the session

From another terminal in the Devkit directory:

```sh
./luna-devkit prefs luna-taskbar@wuild
./luna-devkit prefs luna-desktop@wuild
./luna-devkit prefs luna-wallpaper@wuild
./luna-devkit run gtk4-demo
```

Commands use the private display and session bus. Apps that forward to an existing instance may need their own new-instance option. GNOME may show its native sharing indicator because the viewer uses screencasting.

**This is a separate desktop session, not a filesystem sandbox.** Apps still have your user’s file permissions. In particular, Wallpaper’s administrator-only GDM helper affects the real system even when opened from Devkit.

## Tests and screenshots

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
./luna-devkit test
./luna-devkit test --monitor 1280x800 --monitor 1024x768
python3 scripts/capture-readme.py --output /tmp/luna-screenshots
```

Build linked extensions before running the screenshot script. Integration tests and screenshots use disposable settings and a temporary Desktop folder. The capture script produces real 1600 × 1000 screenshots of widgets, panels, grouped previews, edit mode, and Wallpaper controls. It uses sample notes and application windows, not personal files.

Interactive state lives under `.state/profile/`; logs live under `.state/`. These paths and `extensions.local.json` are excluded from Git. To start fresh, stop Devkit and move `.state/profile/` aside as a backup.

## The Luna projects

[Taskbar](https://github.com/Wuild/luna-taskbar) · [Desktop](https://github.com/Wuild/luna-desktop) · [Wallpaper](https://github.com/Wuild/luna-wallpaper)

Also from the same author: [Mutter Unmuted](https://github.com/Wuild/mutter-unmuted), an experimental Mutter/Xwayland patch pair for legacy X11 push-to-talk on GNOME Wayland. Devkit does not install or enable these system patches.

[Report an issue or share an idea](https://github.com/Wuild/luna-devkit/issues). Include your distribution, GNOME version, linked projects, and relevant log output.

## License

Copyright © 2026 Wuild. Licensed under [GPL-2.0-or-later](LICENSE). You are welcome to use, study, modify, and redistribute it under those terms.
