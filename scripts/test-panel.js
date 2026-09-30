import Gtk from 'gi://Gtk?version=4.0';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const app = new Gtk.Application({application_id: 'org.luna.Devkit.TestPanel'});
let window;
app.connect('activate', () => {
if (window) { window.present(); return; }
window = new Gtk.ApplicationWindow({application: app, title: 'Luna Devkit — Test panel', default_width: 520, default_height: 680});
const box = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, spacing: 12,
    margin_top: 20, margin_bottom: 20, margin_start: 20, margin_end: 20});
const scroll = new Gtk.ScrolledWindow({hscrollbar_policy: Gtk.PolicyType.NEVER, child: box});
window.set_child(scroll);
box.append(new Gtk.Label({label: 'Devkit test panel', xalign: 0, css_classes: ['title-1']}));
box.append(new Gtk.Label({label: 'Sample content and settings for this virtual desktop.', xalign: 0, wrap: true}));
box.append(new Gtk.Label({label: 'Grouped notifications', xalign: 0, css_classes: ['title-2']}));
box.append(new Gtk.Label({wrap: true, xalign: 0, label:
    'Send samples, then open the taskbar’s notification panel. Expand and collapse the group, dismiss its top card, and add another message while the panel is open.'}));
const status = new Gtk.Label({wrap: true, xalign: 0, label: 'Ready. Only this Devkit session receives the samples.'});
const ids = new Set();
let sequence = 0;
const titleEntry = new Gtk.Entry({text: 'Sample message', placeholder_text: 'Notification title'});
const bodyEntry = new Gtk.Entry({text: 'Test notification content. Expand the group to read every message.', placeholder_text: 'Notification body'});
const urgent = new Gtk.CheckButton({label: 'Critical urgency (stays visible until dismissed)'});
box.append(titleEntry);
box.append(bodyEntry);
box.append(urgent);
function call(method, parameters) {
    return Gio.DBus.session.call_sync('org.freedesktop.Notifications', '/org/freedesktop/Notifications',
        'org.freedesktop.Notifications', method, parameters, null, Gio.DBusCallFlags.NONE, 5000, null);
}
function send(count) {
    for (let i = 0; i < count; i++) {
        const n = ++sequence;
        const [id] = call('Notify', new GLib.Variant('(susssasa{sv}i)', [
            'Luna Devkit notification test', 0, 'dialog-information-symbolic', `${titleEntry.text || 'Sample message'} ${n}`,
            bodyEntry.text,
            [], {'urgency': new GLib.Variant('y', urgent.active ? 2 : 1)}, 0,
        ])).deepUnpack();
        ids.add(id);
    }
    status.label = `Sent ${count} sample${count === 1 ? '' : 's'}. Open the taskbar’s notification panel to inspect the group.`;
}
function button(label, action) {
    const widget = new Gtk.Button({label});
    widget.connect('clicked', () => {
        try { action(); } catch (error) { status.label = `Could not update test notifications: ${error.message}`; }
    });
    box.append(widget);
}
button('Send 3 grouped notifications', () => send(3));
button('Add one notification', () => send(1));
button('Send 10 notifications (scroll test)', () => send(10));
button('Clear test notifications', () => {
    for (const id of ids) call('CloseNotification', new GLib.Variant('(u)', [id]));
    ids.clear();
    status.label = 'Test notifications cleared.';
});
box.append(status);
const samples = new Set();
box.append(new Gtk.Separator());
box.append(new Gtk.Label({label: 'Test windows', xalign: 0, css_classes: ['title-2']}));
button('Open 3 sample windows', () => {
    for (let i = 1; i <= 3; i++) {
        const sample = new Gtk.ApplicationWindow({application: app, title: `Devkit sample ${i}`,
            default_width: 340 + i * 40, default_height: 220 + i * 30,
            child: new Gtk.Label({label: `Sample window ${i}\n\nTry taskbar grouping, previews, tiling and minimizing.`, wrap: true})});
        samples.add(sample);
        sample.connect('close-request', () => { samples.delete(sample); return false; });
        sample.present();
    }
});
button('Close sample windows', () => { for (const sample of [...samples]) sample.close(); });
box.append(new Gtk.Separator());
box.append(new Gtk.Label({label: 'Session appearance', xalign: 0, css_classes: ['title-2']}));
const interfaceSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});
const originalScheme = interfaceSettings.get_string('color-scheme');
const originalAnimations = interfaceSettings.get_boolean('enable-animations');
button('Use light appearance', () => interfaceSettings.set_string('color-scheme', 'prefer-light'));
button('Use dark appearance', () => interfaceSettings.set_string('color-scheme', 'prefer-dark'));
const animations = new Gtk.CheckButton({label: 'Enable animations'});
interfaceSettings.bind('enable-animations', animations, 'active', Gio.SettingsBindFlags.DEFAULT);
box.append(animations);
button('Restore appearance from when panel opened', () => {
    interfaceSettings.set_string('color-scheme', originalScheme);
    interfaceSettings.set_boolean('enable-animations', originalAnimations);
});
box.append(new Gtk.Separator());
box.append(new Gtk.Label({label: 'Extension settings', xalign: 0, css_classes: ['title-2']}));
for (const [name, uuid] of [['Taskbar', 'luna-taskbar@wuild'], ['Desktop', 'luna-desktop@wuild'], ['Wallpaper', 'luna-wallpaper@wuild']]) {
    if (GLib.file_test(GLib.build_filenamev([GLib.get_user_data_dir(), 'gnome-shell', 'extensions', uuid]), GLib.FileTest.IS_DIR))
        button(`${name} settings`, () => Gio.Subprocess.new(['gnome-extensions', 'prefs', uuid], Gio.SubprocessFlags.NONE));
}
window.connect('close-request', () => { window = null; return false; });
window.present();
});
app.run([]);
