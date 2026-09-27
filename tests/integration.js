import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Scripting from 'resource:///org/gnome/shell/ui/scripting.js';
function assert(value, message) { if (!value) throw new Error(message); }
function surfaces() { return global.get_window_actors().map(a => a.meta_window).filter(w => w?.get_title()?.startsWith('Luna Desktop:')); }
async function checkDesktop() {
    for (let i = 0; i < 50 && surfaces().length !== Main.layoutManager.monitors.length; i++) await Scripting.sleep(100);
    await Scripting.sleep(500);
    assert(surfaces().length === Main.layoutManager.monitors.length, 'Desktop covers each monitor');
    for (const w of surfaces()) {
        assert(w.get_window_type() === Meta.WindowType.DESKTOP && w.skip_taskbar, 'Desktop stays out of taskbar');
        const currentWork = Main.layoutManager.getWorkAreaForMonitor(w.get_monitor());
        const taskbar = Main.extensionManager.lookup('luna-taskbar@wuild');
        const work = taskbar?.state === 1
            ? taskbar.stateObj.runtime?.getDesktopWorkArea(w.get_monitor(), currentWork) ?? currentWork : currentWork;
        const frame = w.get_frame_rect();
        assert(frame.x === work.x && frame.y === work.y && frame.width === work.width && frame.height === work.height,
            `Desktop follows taskbar work area: ${[frame.x,frame.y,frame.width,frame.height]} vs ${[work.x,work.y,work.width,work.height]} on ${w.get_title()} monitor ${w.get_monitor()}`);
    }
}
export async function run() {
    await Scripting.sleep(2000);
    Main.overview.hide();
    const ids = JSON.parse(GLib.getenv('LUNA_DEVKIT_UUIDS'));
    assert(ids.length > 0, 'At least one extension linked');
    if (!ids.includes('lunabar@wuild')) assert(!Main.extensionManager.lookup('lunabar@wuild'), 'Legacy LunaBar is not implicitly installed');
    for (const id of ids) {
        const extension = Main.extensionManager.lookup(id);
        assert(extension?.state === 1, `${id} failed to enable: ${extension?.error ?? extension?.state}`);
    }
    const wallpaper = Main.extensionManager.lookup('luna-wallpaper@wuild');
    if (wallpaper) {
        const instance = wallpaper.stateObj;
        assert(instance._button && instance._timer, 'Wallpaper menu and scheduler started');
        assert(instance._settings.get_uint('interval') === 0, 'Wallpaper starts in manual mode');
        const timer = instance._timer;
        instance._settings.set_boolean('show-panel-button', false);
        assert(!instance._button && !instance._title, 'Wallpaper button can be hidden');
        assert(instance._timer === timer, 'Hiding Wallpaper button preserves scheduler');
        instance._settings.set_strv('providers', []);
        await instance._change('random');
        assert(instance._settings.get_string('status').includes('No matching images'), 'Wallpaper reports empty provider selection');
        assert(!instance._busy && !instance._process, 'Wallpaper cleans up failed worker');
        instance._settings.set_boolean('show-panel-button', true);
        assert(instance._button && instance._title, 'Wallpaper button can be restored live');
        instance._settings.set_strv('providers', ['bing']);
        instance.disable();
        assert(!instance._timer && !instance._button, 'Wallpaper disable cleans up timer and menu');
        instance.enable();
        assert(instance._button && instance._timer, 'Wallpaper re-enables');
    }
    const desktop = Main.extensionManager.lookup('luna-desktop@wuild');
    const taskbar = Main.extensionManager.lookup('luna-taskbar@wuild');
    if (desktop && wallpaper) {
        const activePath = () => desktop.stateObj.controller?._layout.find(layout => layout.wallpaperPath)?.wallpaperPath;
        const {wallpaperMenuEntries} = await import(GLib.filename_to_uri(`${desktop.path}/desktop/wallpaper.js`, null));
        const fail = message => { throw new Error(message); };
        assert(activePath() === wallpaper.path, 'Desktop discovers active Wallpaper');
        const entries = wallpaperMenuEntries(activePath, fail);
        assert(entries.length === 1 && entries[0][0] === 'Change wallpaper', 'Desktop offers Wallpaper preferences');
        Main.extensionManager.disableExtension(wallpaper.uuid);
        for (let i = 0; i < 50 && (activePath() || wallpaper.state !== 2); i++) await Scripting.sleep(100);
        assert(wallpaper.state === 2, 'Wallpaper finished disabling before re-enable');
        assert(!activePath(), 'Desktop detects disabled Wallpaper without restarting');
        assert(wallpaperMenuEntries(activePath, fail).length === 0, 'Desktop hides Wallpaper action while disabled');
        entries[0][1](); // An already-open menu must not launch disabled preferences.
        Main.extensionManager.enableExtension(wallpaper.uuid);
        for (let i = 0; i < 30 && !activePath(); i++) await Scripting.sleep(100);
        assert(activePath() === wallpaper.path, `Desktop detects re-enabled Wallpaper (state ${wallpaper.state}, path ${activePath()})`);
    }
    if (desktop) await checkDesktop();
    if (taskbar) {
        const runtime = taskbar.stateObj.runtime;
        assert(runtime._bar.mapped && runtime._bar.height > 0, 'Taskbar mapped alongside Desktop');
        runtime._settings.set_int('taskbar-height', 64);
        await Scripting.sleep(800);
        assert(runtime._bar.height === 64, 'Taskbar setting applied');
        if (desktop) {
            await checkDesktop();
            assert(!desktop.stateObj.settings.raw.settings_schema.has_key('taskbar-height'), 'Independent settings');
            const frames = () => surfaces().map(w => {const r = w.get_frame_rect(); return [r.x, r.y, r.width, r.height];});
            const before = JSON.stringify(frames());
            for (const floating of [true, false, true]) {
                runtime._settings.set_boolean('taskbar-floating', floating);
                await Scripting.sleep(600);
                assert(JSON.stringify(frames()) === before, 'Floating toggle preserves desktop grid area');
                await checkDesktop();
            }
            runtime._settings.set_boolean('taskbar-floating', false);
        }
    }
    if (desktop) {
        desktop.stateObj.settings.set_boolean('desktop-widgets-enabled', true);
        desktop.stateObj.settings.set_strv('desktop-enabled-widgets', ['clock', 'sticky-note']);
        await Scripting.sleep(600);
        desktop.stateObj.disable();
        await Scripting.sleep(400);
        assert(surfaces().length === 0, 'Desktop cleanup');
        if (taskbar) assert(taskbar.stateObj.runtime._bar.mapped, 'Taskbar survives Desktop shutdown');
        desktop.stateObj.enable();
        await checkDesktop();
    }
    for (const id of [...ids].reverse()) Main.extensionManager.lookup(id).stateObj.disable();
    await Scripting.sleep(400);
    for (const id of ids) Main.extensionManager.lookup(id).stateObj.enable();
    await Scripting.sleep(500);
    if (desktop) await checkDesktop();
    if (taskbar) assert(taskbar.stateObj.runtime._bar.mapped, 'Taskbar re-enabled');
    print('LUNA_DEVKIT_INTEGRATION_PASS');
}
