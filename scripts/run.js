import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
const [filename, ...command] = ARGV;
const [, bytes] = Gio.File.new_for_path(filename).load_contents(null);
const environment = JSON.parse(new TextDecoder().decode(bytes));
const bus = Gio.DBusConnection.new_for_address_sync(environment.DBUS_SESSION_BUS_ADDRESS,
    Gio.DBusConnectionFlags.AUTHENTICATION_CLIENT | Gio.DBusConnectionFlags.MESSAGE_BUS_CONNECTION, null, null);
const [display] = bus.call_sync('org.gnome.Mutter.Devkit', '/org/gnome/Mutter/Devkit',
    'org.freedesktop.DBus.Properties', 'Get', new GLib.Variant('(ss)', ['org.gnome.Mutter.Devkit', 'Env']),
    null, Gio.DBusCallFlags.NONE, 5000, null).recursiveUnpack();
const values = {...environment, ...display, GDK_BACKEND: 'wayland', GTK_A11Y: 'none'};
// Update only this private bus, so D-Bus activated preferences use the virtual display too.
bus.call_sync('org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus',
    'UpdateActivationEnvironment', new GLib.Variant('(a{ss})', [values]), null, Gio.DBusCallFlags.NONE, 5000, null);
const launcher = new Gio.SubprocessLauncher({flags: Gio.SubprocessFlags.NONE});
for (const [key, value] of Object.entries(values)) launcher.setenv(key, value, true);
const process = launcher.spawnv(command);
process.wait_check(null);
launcher.close();
