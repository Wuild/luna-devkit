# Luna launch drafts

These are drafts for later posting. No Reddit, Discord, or GNOME Extensions submission has been made.

## Reddit

**Title:** I’m building Luna: a customizable taskbar, desktop widgets, and wallpaper tools for GNOME 50

I wanted a GNOME desktop with a little more room to make it my own, so I’ve been building Luna.

There are three separate extensions, so you can pick the pieces you want:

- **Luna Taskbar:** grouped apps, animated previews, floating or attached layouts on any screen edge, multi-monitor support, and calendar/system panels.
- **Luna Desktop:** desktop shortcuts, sticky notes, clocks, a personal agenda, quick links, media controls, and resource widgets you can move and customize.
- **Luna Wallpaper:** Bing daily images, random wallpapers, and scheduled rotation.

I’ve also made **Luna Devkit**, which runs the extensions in a separate GNOME session for experimenting and testing. The screenshots use that environment with sample content.

The current target is GNOME Shell 50 on Wayland. The projects are GPL-2.0-or-later, and feedback, ideas, and contributions are welcome. GNOME Extensions website submission is planned; these are not listed there yet.

[Taskbar](https://github.com/Wuild/luna-taskbar) · [Desktop](https://github.com/Wuild/luna-desktop) · [Wallpaper](https://github.com/Wuild/luna-wallpaper) · [Devkit](https://github.com/Wuild/luna-devkit)

A separate project I’ve been working on is [Mutter Unmuted](https://github.com/Wuild/mutter-unmuted): opt-in Mutter and Xwayland patches for legacy X11 push-to-talk across GNOME Wayland, including Discord’s mouse-button PTT. It is experimental, changes system components, and is not required by Luna. Its README explains the tested setup and how input forwarding affects other Xwayland apps.

What would you want to customize first?

**Suggested attachments:** desktop-widgets.png, taskbar-previews.png, taskbar-panels.png. Check the community’s current self-promotion and posting rules before submitting.

## Discord

I’ve been building **Luna** for GNOME 50 on Wayland: a customizable taskbar with grouped previews and panels, desktop widgets and sticky notes, and wallpaper rotation. Each extension works on its own.

Screenshots and installation steps:
https://github.com/Wuild/luna-taskbar
https://github.com/Wuild/luna-desktop
https://github.com/Wuild/luna-wallpaper

Everything is GPL-2.0-or-later. Feedback and ideas are welcome! There’s also [Luna Devkit](https://github.com/Wuild/luna-devkit) for trying the extensions in a separate session. GNOME Extensions website submission is planned.

**Optional follow-up for a relevant Linux/voice-chat channel:** I also maintain [Mutter Unmuted](https://github.com/Wuild/mutter-unmuted), experimental opt-in Mutter/Xwayland patches for legacy X11 push-to-talk across GNOME Wayland. It’s separate from Luna; read its compatibility and input-forwarding notes before trying it.

## GNOME Extensions listing copy

### Luna Taskbar

A customizable taskbar with grouped application buttons, animated window previews, a system tray, and calendar/system panels. Choose floating or attached layouts on any screen edge, configure click and scroll actions, and use one or multiple displays. Optional weather and ArcMenu integration. Requires GNOME Shell 50.

### Luna Desktop

Desktop icons and customizable GTK widgets for GNOME Shell 50 on Wayland. Arrange shortcuts, sticky notes, clocks, weather, calendar, quick links, media, resources, and storage widgets. Move and resize widgets through Edit Desktop and customize their appearance.

### Luna Wallpaper

Bing daily images, random wallpaper discovery, and automatic rotation for GNOME Shell 50. Choose providers, categories, keywords, and a rotation interval. Starts in manual mode. Downloads require network access.

## Before submitting to GNOME Extensions

Prepare and review each extension separately against the then-current GNOME review guidelines. Verify all bundled files and helper processes, and review Wallpaper’s optional privileged GDM helper in particular. Do not claim acceptance until review is complete. Devkit and Mutter Unmuted are separate developer/system projects, not Shell extensions to upload as part of the three ZIPs.
