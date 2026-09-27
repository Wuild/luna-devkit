import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Scripting from 'resource:///org/gnome/shell/ui/scripting.js';
async function capture(name) {
    await Scripting.sleep(800);
    const stream = Gio.File.new_for_path(`${GLib.getenv('LUNA_SCREENSHOT_DIR')}/${name}.png`).replace(null, false, Gio.FileCreateFlags.NONE, null);
    await new Shell.Screenshot().screenshot(false, stream);
    stream.close(null);
}
export async function run() {
    await Scripting.sleep(2500);
    Main.overview.hide();
    const iface = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
    iface.set_string('color-scheme', 'prefer-dark');
    iface.set_string('clock-format', '24h');
    new Gio.Settings({schema_id:'org.gnome.desktop.notifications'}).set_boolean('show-banners', false);
    const background = new Gio.Settings({schema_id: 'org.gnome.desktop.background'});
    background.set_string('primary-color', '#182938');
    background.set_string('secondary-color', '#344e66');
    background.set_string('color-shading-type', 'vertical');
    const desktop = Main.extensionManager.lookup('luna-desktop@wuild').stateObj;
    const r = Main.extensionManager.lookup('luna-taskbar@wuild').stateObj.runtime;
    r._settings.set_boolean('taskbar-floating', true);
    r._settings.set_int('taskbar-end-gap', 24);
    r._settings.set_int('taskbar-edge-gap', 12);
    r._settings.set_int('taskbar-corner-radius', 16);
    r._settings.set_boolean('show-workspace-switcher', true);
    r._settings.set_boolean('separate-applet-panels', false);
    const shellSettings = new Gio.Settings({schema_id: 'org.gnome.shell'});
    shellSettings.set_strv('favorite-apps', ['org.gnome.Nautilus.desktop', 'org.gnome.TextEditor.desktop', 'org.gnome.Calculator.desktop', 'org.gnome.Settings.desktop']);
    const s = desktop.settings;
    s.set_boolean('desktop-show-external-drives', false);
    s.set_boolean('desktop-show-network-drives', false);
    s.set_strv('desktop-enabled-widgets', ['clock', 'sticky-note', 'resources', 'calendar', 'quick-links']);
    s.set_string('desktop-widget-positions', JSON.stringify(Object.fromEntries(Object.entries({
        clock: [1050, 70], resources: [1050, 260], 'sticky-note': [190, 130], calendar: [630, 150], 'quick-links': [1050, 500],
    }).map(([id, [x,y]]) => [id, {anchorX:'left',anchorY:'top',offsetX:x,offsetY:y}]))));
    s.set_string('desktop-widget-options', JSON.stringify({
        clock: {width:380,height:150,textSize:54}, resources: {width:380,height:190,background:true,backgroundOpacity:55},
        'sticky-note': {width:340,height:340,title:'Ideas for the week',textSize:20},
        calendar: {width:340,height:460,background:true,backgroundOpacity:55},
        'quick-links': {width:380,height:190,background:true,backgroundOpacity:55},
    }));
    s.set_boolean('desktop-widgets-enabled', true);
    await Scripting.sleep(1800);
    await capture('desktop-widgets');
    r._panelBridge._systemPanel.menu.open('system');
    await capture('taskbar-panels');
    r._panelBridge._systemPanel.menu.close();
    await Scripting.sleep(400);
    r._appletEditor.start();
    await capture('taskbar-edit');
    r._appletEditor.stop();
    const wallpaper = Main.extensionManager.lookup('luna-wallpaper@wuild').stateObj;
    wallpaper._button.menu.open();
    await capture('wallpaper-menu');
    wallpaper._button.menu.close();
    const launcher = new Gio.SubprocessLauncher({flags: Gio.SubprocessFlags.NONE});
    launcher.set_environ(global.create_app_launch_context(0, -1).get_environment());
    launcher.setenv('GDK_BACKEND', 'wayland', true);
    const child = launcher.spawnv(['python3', `${GLib.getenv('LUNA_DEVKIT_ROOT')}/scripts/screenshot-windows.py`]);
    try {
        let task;
        for (let i=0;i<40;i++) {
            await Scripting.sleep(150);
            task = [...r._buttons.values()].find(t => t.windows.length === 3 && t.window?.get_title().startsWith('Luna demo'));
            if (task) break;
        }
        if (!task) throw new Error('Sample windows did not appear');
        s.set_boolean('desktop-widgets-enabled', false);
        await Scripting.sleep(1200);
        for (const [index, window] of task.windows.entries())
            window.move_resize_frame(false, 140 + index * 460, 200, 420, 340);
        await Scripting.sleep(1800);
        r._preview.show(task, task.button);
        await capture('taskbar-previews');
        r._preview.hide();
    } finally {child.force_exit();}
    await Scripting.sleep(400);
    launcher.setenv('GI_TYPELIB_PATH', GLib.getenv('LUNA_SHELL_TYPELIB_DIR'), true);
    launcher.setenv('LD_LIBRARY_PATH', GLib.getenv('LUNA_SHELL_LIBRARY_DIR'), true);
    const prefsProcess = launcher.spawnv(['gjs', '-m', `${GLib.getenv('LUNA_DEVKIT_ROOT')}/scripts/screenshot-prefs.js`, Main.extensionManager.lookup('luna-wallpaper@wuild').path]);
    await Scripting.sleep(1600);
    const prefs = global.get_window_actors().map(a => a.meta_window).find(w => w.get_title()?.includes('Wallpaper'));
    if (!prefs) throw new Error('Wallpaper preferences did not open');
    prefs.move_frame(false, 380, 60);
    await capture('wallpaper-settings');
    prefsProcess.force_exit();
    print('LUNA_README_CAPTURE_PASS');
}
