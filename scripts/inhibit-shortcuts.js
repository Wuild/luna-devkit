import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Use only the private Devkit bus. The viewer is a non-unique application,
// so discover its connection rather than relying on a well-known bus name.
const environment = ARGV[0]
    ? JSON.parse(new TextDecoder().decode(GLib.file_get_contents(ARGV[0])[1]))
    : null;
const bus = environment
    ? Gio.DBusConnection.new_for_address_sync(environment.DBUS_SESSION_BUS_ADDRESS,
        Gio.DBusConnectionFlags.AUTHENTICATION_CLIENT | Gio.DBusConnectionFlags.MESSAGE_BUS_CONNECTION, null, null)
    : Gio.bus_get_sync(Gio.BusType.SESSION, null);
const path = '/org/gnome/Mutter/Mdk';
const action = 'toggle_inhibit_system_shortcuts';
function call(name, object, iface, method, args = null) {
    return bus.call_sync(name, object, iface, method, args, null,
        Gio.DBusCallFlags.NONE, 1000, null).recursiveUnpack();
}
const deadline = GLib.get_monotonic_time() + 20 * 1000000;
let enabled = false;
while (!enabled && GLib.get_monotonic_time() < deadline) {
    const [names] = call('org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', 'ListNames');
    for (const name of names.filter(name => name.startsWith(':'))) {
        try {
            const [pid] = call('org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus',
                'GetConnectionUnixProcessID', new GLib.Variant('(s)', [name]));
            if (!GLib.file_read_link(`/proc/${pid}/exe`).endsWith('/mutter-devkit')) continue;
            call(name, path, 'org.gtk.Actions', 'SetState',
                new GLib.Variant('(sva{sv})', [action, new GLib.Variant('b', true), {}]));
            const [description] = call(name, path, 'org.gtk.Actions', 'Describe', new GLib.Variant('(s)', [action]));
            if (description[2][0] === true) {
                enabled = true;
                break;
            }
        } catch {
            // The viewer may still be starting or exporting its actions.
        }
    }
    if (!enabled) GLib.usleep(250000);
}
if (!enabled) throw new Error('Could not enable Devkit shortcut inhibition within 20 seconds');
print('Devkit: system shortcuts inhibited in the viewer (Input menu can disable this).');
