#!/usr/bin/env python3
"""Sample GTK windows used only by the README capture session."""
import gi
gi.require_version('Gtk', '4.0')
from gi.repository import Gtk
app = Gtk.Application(application_id='org.luna.ScreenshotDemo')
def activate(app):
    for title, icon, subtitle in [('Plan', 'x-office-calendar-symbolic', 'Make room for what matters.'), ('Write', 'accessories-text-editor-symbolic', 'Start with a good idea.'), ('Build', 'applications-engineering-symbolic', 'Bring your next project to life.')]:
        window = Gtk.ApplicationWindow(application=app, title=f'Luna demo — {title}', default_width=640, default_height=400)
        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20, valign=Gtk.Align.CENTER, halign=Gtk.Align.CENTER)
        box.append(Gtk.Image(icon_name=icon, pixel_size=64))
        label = Gtk.Label(label=title); label.add_css_class('title-1'); box.append(label)
        box.append(Gtk.Label(label=subtitle))
        window.set_child(box)
        window.present()
app.connect('activate', activate)
app.run(None)
