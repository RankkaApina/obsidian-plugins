/*
 Couldn't have done this without the help of following plugins:
 - Snippet Commands
 - Theme Picker
*/

const { Plugin, Notice } = require("obsidian");

module.exports = class ToggleAllPlugin extends Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.state = {
      "savedSnippets": [],
      "snippetsDisabled": false,
      "savedPlugins": [],
      "pluginsDisabled": false,
      "savedPalette": null
    };

    // Snippets
    this.snippetsIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code2-icon lucide-file-code-2">
    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m5 12-3 3 3 3"/><path d="m9 18 3-3-3-3"/>
    </svg>`

    // Plugin
    this.pluginIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-toy-brick-icon lucide-toy-brick">
    <rect width="18" height="12" x="3" y="8" rx="1"/>
    <path d="M10 8V5c0-.6-.4-1-1-1H6a1 1 0 0 0-1 1v3"/>
    <path d="M19 8V5c0-.6-.4-1-1-1h-3a1 1 0 0 0-1 1v3"/>
    </svg>`;

    // Color Theme
    this.paletteIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-palette-icon lucide-palette">
    <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
    </svg>`

    // Light/Dark Mode
    this.DARK_MODE_KEY = "obsidian";
    this.LIGHT_MODE_KEY = "moonstone";

    this.moonIconSvg = `
    <path fill="none" d="M0 0h24v24H0z"/>
    <path stroke="currentColor" stroke-width="2" d="M10 7a7 7 0 0 0 12 4.9v.1c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2h.1A6.979 6.979 0 0 0 10 7zm-6 5a8 8 0 0 0 15.062 3.762A9 9 0 0 1 8.238 4.938 7.999 7.999 0 0 0 4 12z"/>
    `;
    this.sunIconSvg = `
    <path stroke="currentColor" stroke-width="2" d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z"/>
    `;
  }

  async onload() {
    // Load saved state
    const data = await this.loadData();
    if (data) this.state = data;
    
    this.addCommand({
      id: "toggle-snippets",
      name: "Toggle all active snippets",
      callback: () => this.toggleSnippets(),
    });

    this.addCommand({
      id: "toggle-community-plugins",
      name: "Toggle all community plugins",
      callback: () => this.togglePlugins(),
    });

    this.addCommand({
      id: "toggle-default-theme",
      name: "Toggle default theme",
      callback: () => this.togglePalette(),
    });

    this.addCommand({
      id: 'toggle-light-dark-mode',
      name: 'Toggle light/dark mode',
      callback: () => this.toggleMode()
    });

    // --- Status bar button for snippets toggle ---
    this.snippetsButton = this.addStatusBarItem();
    this.snippetsButton.addClass("toggle-snippets-btn");
    this.snippetsButton.setAttr("title", "Toggle all active");
    // Use the SVG icon instead of text
    this.snippetsIcon = this.createStatusBarIcon(this.snippetsIconSvg);
    this.snippetsButton.appendChild(this.snippetsIcon);
    this.snippetsButton.addEventListener("click", () => this.toggleSnippets());


    // --- Status bar button for plugin toggle ---
    this.pluginButton = this.addStatusBarItem();
    this.pluginButton.addClass("toggle-plugins-btn");
    this.pluginButton.setAttr("title", "Toggle all community plugins");
    // Use the SVG icon instead of text
    this.pluginIcon = this.createStatusBarIcon(this.pluginIconSvg);
    this.pluginButton.appendChild(this.pluginIcon);
    this.pluginButton.addEventListener("click", () => this.togglePlugins());


    // --- Status bar button for theme toggle ---
    this.paletteButton = this.addStatusBarItem();
    this.paletteButton.addClass("toggle-palette-btn");
    this.paletteButton.setAttr("title", "Toggle default theme");
    // Use the SVG icon instead of text
    this.paletteIcon = this.createStatusBarIcon(this.paletteIconSvg);
    this.paletteButton.appendChild(this.paletteIcon);
    this.paletteButton.addEventListener("click", () => this.togglePalette());

    // Theme icon in status bar
    this.modeButton = this.addStatusBarItem();
    this.modeButton.addClass("toggle-mode-btn");
    this.modeButton.setAttr("title", "Toggle Light/Dark Mode");
    this.modeIcon = this.createStatusBarIcon(this.getModeIcon());
    this.modeButton.appendChild(this.modeIcon);
    this.modeButton.addEventListener("click", () => this.toggleMode());

    // Update icon if theme changes externally
    this.registerEvent(this.app.workspace.on("css-change", () => {
      this.modeIcon.innerHTML = this.getModeIcon();
    }));

    this.updateButtonStyles();
  }

    // --- Toggle active plugins ---
    async toggleSnippets() {
      const css = this.app.customCss;

    if (!this.state.snippetsDisabled) {
      // Save currently enabled snippets
      this.state.savedSnippets = [...css.enabledSnippets];

      // Disable them
      for (const s of this.state.savedSnippets) {
        css.setCssEnabledStatus(s, false);
      }

      this.state.snippetsDisabled = true;
      new Notice("All active snippets disabled.");
    } else {
      // Re-enable previously saved snippets
      for (const s of this.state.savedSnippets) {
        css.setCssEnabledStatus(s, true);
      }

      this.state.snippetsDisabled = false;
      new Notice("Previously active snippets re-enabled.");
    }

    await this.saveData(this.state);
    this.updateButtonStyles();
  }

  // --- Toggle community plugins (never disable self) ---
  async togglePlugins() {
    const plugins = this.app.plugins;
    const selfId = this.manifest.id;

    if (!this.state.pluginsDisabled) {
      this.state.savedPlugins = Object.keys(plugins.plugins).filter(
        (id) => plugins.enabledPlugins.has(id) && id !== selfId
      );

      for (const id of this.state.savedPlugins) {
        await plugins.disablePlugin(id);
      }

      this.state.pluginsDisabled = true;
      new Notice("All community plugins disabled (except toggle plugin).");
    } else {
      for (const id of this.state.savedPlugins) {
        await plugins.enablePlugin(id);
      }

      this.state.pluginsDisabled = false;
      new Notice("Previously active plugins re-enabled.");
    }

    await this.saveData(this.state);
    this.updateButtonStyles();
    this.app.commands.executeCommandById("app:reload");
  }

// --- Toggle default/custom palette ---
async togglePalette() {
  const currentTheme = this.app.vault.getConfig("cssTheme"); // currently applied theme
  const savedTheme = this.state.savedPalette;  // previously saved

  if (!savedTheme && currentTheme) {
    // Save current theme and remove it
    this.state.savedPalette = currentTheme;
    await this.app.customCss.setTheme(""); // remove theme
    new Notice(`Custom theme removed (was: ${currentTheme})`);
  } else if (savedTheme) {
    // Restore previously saved theme
    await this.app.customCss.setTheme(savedTheme);
    new Notice(`Custom theme restored: ${savedTheme}`);
    this.state.savedPalette = null; // reset saved palette
  } else {
    new Notice("No custom theme applied.");
  }

  await this.saveData(this.state);
  this.updateButtonStyles();
}


  // --- Light/Dark Mode toggle ---
  async toggleMode() {

    const currentMode = this.app.vault.getConfig("theme");
    const newMode = currentMode === this.DARK_MODE_KEY ? this.LIGHT_MODE_KEY : this.DARK_MODE_KEY;
    this.app.changeTheme(newMode);

    // Update icon
    this.modeIcon.innerHTML = this.getModeIcon();
    new Notice(`Switched to ${newMode === this.DARK_MODE_KEY ? "Dark" : "Light"} Mode`);
  }

  // --- Helpers for status bar icons ---
  getModeIcon() {
    const currentMode = this.app.vault.getConfig("theme");
    return currentMode === "obsidian" ? this.sunIconSvg : this.moonIconSvg;
  }

  createStatusBarIcon(svgString) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "1.2em");
    svg.setAttribute("height", "1.2em");
    svg.style.verticalAlign = "middle";
    svg.innerHTML = svgString;
    return svg;
  }

  // --- Update button styles ---
  updateButtonStyles() {
    if (this.snippetsButton) {
      this.snippetsButton.toggleClass("is-disabled", this.state.snippetsDisabled);
    }
    if (this.pluginButton) {
      this.pluginButton.toggleClass("is-disabled", this.state.pluginsDisabled);
    }
    if (this.paletteButton) {
        const noThemeApplied = !this.state.savedPalette && !this.app.customCss.theme;
        this.paletteButton.toggleClass("is-disabled", noThemeApplied);
    }
  }
};
