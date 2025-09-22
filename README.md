# Personal Obsidian Plugin Collection

This is my personal plugin collection, I won't develop these in any public manner, they are public if you find them useful. Feel free to adapt to your purposes, if you share publicly, credit would be nice. 

Each plugin is in it's own folder, basically it should work if you download the folder and add it to your plugins folder. The minimum Obsidian version is basically set as whatever I'm using and where it works, it's entirely possible it works with older versions, I just don't have time or interest to test: feel free to do that for yourself.

I will have a short description here what each plugin does.

## Toggle Snippets, Plugins and Themes

Folder: toggle-all

This is something I haven't found in existing plugins (although some functionality exists). It adds 4 status bar buttons (here described from left to right in status bar) that are basically toggles to help with testing themes and/or plugins or just see if customization is causing your current issue:
- Toggle snippets: this toggles all active snippets off and then back on when clicked the second time. It saves the active snippets list, so it only enables snippets you had enabled before the toggle off.
- Toggle plugins: this toggles all active plugins off, except THIS PLUGIN (do so manually) and then back on when desired. If you do manually toggle this off, the list of active plugins and the enabled/disabled state is saved, so you only need to manually toggle this particular plugin, rest will work with one click.
- Toggle color theme: this will toggle your custom theme to default and back. 
- Toggle light/dark mode: this works like the Theme Picker plugin, from where I customized the logic. Toggle easily between light and dark. 

Note: I tried adding the app reload for the plugin toggle (since I learned not all plugins are fully disabled without it), however, that broke the current code, so that would probably need a bit of a different approach.

## Arrow No-Break

Folder: arrow-nobreak

Prevents arrow ligature (`->`) from breaking in live preview. For source and reading mode this can easily be done by CSS, but for live preview I couldn't find a way except for a plugin. I use quite a lot of arrows in my notes, so I found this annoying enough to write a bit of code...

Here's the CSS for source & reading mode:
```
/*----------------------------------------------------------------
  Stop arrow ligatures from breaking
------------------------------------------------------------------
/* Prevent line breaks inside -> only */

/* Apply nowrap to any span that contains -> */
.cm-line span:has-text("->") {
  white-space: nowrap;
}

/* Reading view */
.markdown-preview-view :is(span, p, li, td):has-text("->") {
  white-space: nowrap;
}

/* Source view */
.cm-line:has-text("->") {
  white-space: nowrap;
}
```