'use strict';

var obsidian = require('obsidian');

function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : (
				new P(function (resolve) {
					resolve(value);
				})
			);
	}
	return new (P || (P = Promise))(function (resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator['throw'](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ?
				resolve(result.value)
			:	adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}

var waybackUrl = 'https://web.archive.org/web/';
var waybackSaveUrl = 'https://web.archive.org/save/';

var defaultSettings = {
	archiveText: 'Archived',
	leadWithSpace: false,
	preText: ', (',
	postText: ', archive date: {date})',
	duplicateHandling: 'all',
	compareContent: true,
};

class LinkArchiveSettingTab extends obsidian.PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display() {
		var { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Archive Settings' });

		new obsidian.Setting(containerEl).setName('Pre-link text').addText((text) =>
			text.setValue(this.plugin.settings.preText).onChange(async (v) => {
				this.plugin.settings.preText = v;
				await this.plugin.saveSettings();
			}),
		);

		new obsidian.Setting(containerEl)
			.setName('Space before link')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.leadWithSpace).onChange(async (v) => {
					this.plugin.settings.leadWithSpace = v;
					await this.plugin.saveSettings();
				}),
			);

		new obsidian.Setting(containerEl)
			.setName('Check Similarity')
			.setDesc('Compare archive size to live version.')
			.addToggle((t) =>
				t.setValue(this.plugin.settings.compareContent).onChange(async (v) => {
					this.plugin.settings.compareContent = v;
					await this.plugin.saveSettings();
				}),
			);

		new obsidian.Setting(containerEl)
			.setName('Duplicate Handling')
			.addDropdown((d) =>
				d
					.addOption('all', 'All')
					.addOption('first', 'First')
					.addOption('last', 'Last')
					.setValue(this.plugin.settings.duplicateHandling)
					.onChange(async (v) => {
						this.plugin.settings.duplicateHandling = v;
						await this.plugin.saveSettings();
					}),
			);

		new obsidian.Setting(containerEl).setName('Link text').addText((text) =>
			text.setValue(this.plugin.settings.archiveText).onChange(async (v) => {
				this.plugin.settings.archiveText = v;
				await this.plugin.saveSettings();
			}),
		);

		new obsidian.Setting(containerEl)
			.setName('Post-link text')
			.addText((text) =>
				text.setValue(this.plugin.settings.postText).onChange(async (v) => {
					this.plugin.settings.postText = v;
					await this.plugin.saveSettings();
				}),
			);
	}
}

class ObsidianLinkArchivePlugin extends obsidian.Plugin {
	async onload() {
		await this.loadSettings();
		this.addRibbonIcon('restore-file-glyph', 'Archive Links', () =>
			this.runArchiver(false),
		);

		this.addCommand({
			id: 'archive-all-links-full',
			name: 'Archive all links (Full: Save + Fallback)',
			callback: () => this.runArchiver(false),
		});

		this.addCommand({
			id: 'archive-all-links-quick',
			name: 'Quick Archive (Existing snapshots only)',
			callback: () => this.runArchiver(true),
		});

		this.addSettingTab(new LinkArchiveSettingTab(this.app, this));
	}

	async runArchiver(quickMode) {
		var view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
		if (!view) return;

		var viewData = view.getViewData();
		// Regex is re-initialized here to reset the search index
		var urlRegex =
			/(\b(https?|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

		let allMatches = [];
		let match;
		while ((match = urlRegex.exec(viewData)) !== null) {
			var url = match[0];
			var currentPos = urlRegex.lastIndex;

			// Skip if it's already an archive link
			if (url.includes('web.archive.org')) continue;
			// Skip Youtube
			if (
				url.toLowerCase().includes('youtube.com')
				|| url.toLowerCase().includes('youtu.be')
			)
				continue;
			// Skip if the text immediately following contains web.archive.org
			if (
				viewData
					.substring(currentPos, currentPos + 100)
					.includes('web.archive.org')
			)
				continue;

			allMatches.push({ url: url, endIdx: currentPos });
		}

		console.log(`Found ${allMatches.length} candidate links for archiving.`);

		let filteredMatches = allMatches;
		if (this.settings.duplicateHandling !== 'all') {
			const seen = new Map();
			if (this.settings.duplicateHandling === 'first') {
				filteredMatches = allMatches.filter(
					(m) => !seen.has(m.url) && seen.set(m.url, true),
				);
			} else {
				allMatches.forEach((m) => seen.set(m.url, m.endIdx));
				filteredMatches = allMatches.filter(
					(m) => seen.get(m.url) === m.endIdx,
				);
			}
		}

		var reverseMatches = filteredMatches.reverse();
		if (reverseMatches.length === 0) {
			new obsidian.Notice('No new links to process.');
			return;
		}

		let successCount = 0;
		let failCount = 0;
		const processingNotice = new obsidian.Notice(
			quickMode ?
				`Quick Archiving ${reverseMatches.length} links...`
			:	`Full Archiving ${reverseMatches.length} links...`,
			0,
		);

		for (var { url, endIdx } of reverseMatches) {
			let finalArchiveUrl = null;
			let finalDate = null;

			if (!quickMode) {
				try {
					await obsidian.request({ url: `${waybackSaveUrl}${url}` });
					finalArchiveUrl = `${waybackUrl}${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${url}`;
					finalDate = new Date().toISOString().slice(0, 10);
				} catch (e) {
					console.log(`Save failed for ${url}, falling back to lookup...`);
				}
			}

			if (!finalArchiveUrl) {
				try {
					const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=10&filter=statuscode:200&collapse=timestamp:8&sort=reverse`;
					const history = JSON.parse(await obsidian.request({ url: cdxUrl }));

					if (history && history.length > 1) {
						const snap = history[1];
						const ts = snap[1];
						finalArchiveUrl = `${waybackUrl}${ts}/${url}`;
						finalDate = `${ts.substring(0, 4)}-${ts.substring(4, 6)}-${ts.substring(6, 8)}`;
					}
				} catch (err) {
					console.error(`Lookup failed for ${url}`);
				}
			}

			if (finalArchiveUrl) {
				var midSpace = this.settings.leadWithSpace ? ' ' : '';
				var archiveMarkdown = (
					this.settings.preText
					+ midSpace
					+ '['
					+ this.settings.archiveText.trim()
					+ ']('
					+ finalArchiveUrl
					+ ')'
					+ this.settings.postText.replace('{date}', finalDate)
				).replace(/[\r\n]+/gm, '');

				let curIdx = endIdx;
				const docText = view.editor.getValue();

				// Jump over closing markdown brackets
				if (curIdx < docText.length) {
					const next = docText.charAt(curIdx);
					if (next === ')' || next === ']') curIdx++;
				}

				// Check for trailing space in the note and remove it
				if (curIdx > 0 && docText.charAt(curIdx - 1) === ' ') {
					view.editor.replaceRange(
						'',
						view.editor.offsetToPos(curIdx - 1),
						view.editor.offsetToPos(curIdx),
					);
					curIdx--;
				}

				view.editor.replaceRange(
					archiveMarkdown,
					view.editor.offsetToPos(curIdx),
				);
				successCount++;
			} else {
				failCount++;
			}
			// Standard delay to avoid hitting Wayback rate limits
			await new Promise((r) => setTimeout(r, 500));
		}
		processingNotice.hide();
		new obsidian.Notice(
			`Finished! Added: ${successCount}, Failed: ${failCount}`,
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, defaultSettings, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

module.exports = ObsidianLinkArchivePlugin;
