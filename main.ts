import {App, Editor, EditorPosition, EditorSuggest, EditorSuggestTriggerInfo, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';

const RE_ANCHOR_NO_DISPLAY = /!?\[\[([^\]]+#[^|\n\r\]]+)\]\]$/;
const RE_ANCHOR_DISPLAY = /(\[\[([^\]]+#[^\n\r\]]+)\]\])$/;
const RE_DISPLAY = /\|([^\]]+)/;


interface AnchorDisplaySuggestion {
	displayText: string;
	source: string;
}

interface AnchorDisplayTextSettings {
	includeNoteName: string;
	titleProperty: string;
	whichHeadings: string;
	includeNotice: boolean;
	sep: string;
	suggest: boolean;
	ignoreEmbedded: boolean;
}

const DEFAULT_SETTINGS: AnchorDisplayTextSettings = {
	includeNoteName: 'headersOnly',
	titleProperty: '',
	whichHeadings: 'allHeaders',
	includeNotice: false,
	sep: ' ',
	suggest: true,
	ignoreEmbedded: true,
}

export default class AnchorDisplayText extends Plugin {
	settings: AnchorDisplayTextSettings;
	suggestionsRegistered: boolean = false;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new AnchorDisplayTextSettingTab(this.app, this));
		if (this.settings.suggest) {
            this.registerEditorSuggest(new AnchorDisplaySuggest(this));
			this.suggestionsRegistered = true;
        }

		// look for header link creation
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor) => {
				
				// only process when at the end of a Wikilink
				const cursor = editor.getCursor();
				const currentLine = editor.getLine(cursor.line);
				const lastChars = currentLine.slice(cursor.ch - 2, cursor.ch);
				if (lastChars !== ']]') return;
				
				// match anchor links WITHOUT an already defined display text
				const match = currentLine.slice(0, cursor.ch).match(RE_ANCHOR_NO_DISPLAY);
				if (match) {
					// optionally ignore embedded links
					if (this.settings.ignoreEmbedded && match[0].charAt(0) === '!') return;
					// handle multiple subheadings
					const headings = match[1].split('#')
					let notename = headings[0];

					// support title property
					if (this.settings.titleProperty) {
						notename = this.getTitleFromFile(notename);
					}

					let displayText = ''
					if (this.settings.whichHeadings === 'lastHeader') {
						displayText = headings[headings.length - 1];
					} else {
						displayText = headings[1];
						if (this.settings.whichHeadings === 'allHeaders') {
							for (let i = 2; i < headings.length; i++) {
								displayText += this.settings.sep + headings[i];
							}
						}
					}
					const startIndex = (match.index ?? 0) + match[0].length - 2;
					// add note name to display text if wanted
					if (this.settings.includeNoteName === 'noteNameFirst') {
						displayText = `${notename}${this.settings.sep}${displayText}`;
					} else if (this.settings.includeNoteName === 'noteNameLast') {
						displayText = `${displayText}${this.settings.sep}${notename}`;
					}

					if (displayText.startsWith('^')) {
						displayText = displayText.slice(1);
					}

					// change the display text of the link
					editor.replaceRange(`|${displayText}`, {line: cursor.line, ch: startIndex}, undefined, 'headerDisplayText');
					if (this.settings.includeNotice) {
						new Notice(`Updated anchor link display text.`);
					}
				}
			})
		);
	}

	onunload() {

	}

	/**
	 * Get title property value from file's frontmatter
	 * @param filename - The filename to look up
	 * @returns The title property value if found, otherwise returns the original filename
	 */
	public getTitleFromFile(filename: string): string {
		// support title property
		if (this.settings.titleProperty) {
			// get note title
			const file = this.app.metadataCache.getFirstLinkpathDest(filename, '');
			if (file) {
				const cache = this.app.metadataCache.getFileCache(file);
				if (cache && cache.frontmatter && cache.frontmatter[this.settings.titleProperty]) {
					return String(cache.frontmatter[this.settings.titleProperty]);
				}
			}
		}
		return filename;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

class AnchorDisplaySuggest extends EditorSuggest<AnchorDisplaySuggestion> {
	private plugin: AnchorDisplayText;
	private suggestionSelected: EditorPosition | null = null;

	constructor(plugin: AnchorDisplayText) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		// turns off suggestions if the setting is disabled but the app hasn't been reloaded
		if (!this.plugin.settings.suggest) return null;
		if (this.suggestionSelected) {
			if (this.suggestionSelected.ch === cursor.ch 
				&& this.suggestionSelected.line === cursor.line) return null;
			this.suggestionSelected = null;
			return null;
		}
		
		// only process when at the end of a Wikilink
		const currentLine = editor.getLine(cursor.line);
		const lastChars = currentLine.slice(cursor.ch - 2, cursor.ch);
		if (lastChars !== ']]') return null;

		// match anchor link even if it has display text
		const slice = currentLine.slice(0, cursor.ch);
		const match = slice.match(RE_ANCHOR_DISPLAY);

		if (!match) return null;
		// optionally ignore embedded links
		if (this.plugin.settings.ignoreEmbedded && slice.charAt(match.index! - 1) === '!') return null;

		return {
			start: {
				line: cursor.line,
				ch: match.index! + match[1].length - 2, // 2 less to keep closing brackets
			},
			end: {
				line: cursor.line,
				ch: match.index! + match[1].length - 2,
			},
			query: match[2],
		};
	}

	getSuggestions(context: EditorSuggestTriggerInfo): AnchorDisplaySuggestion[] {
		// don't include existing display text in headings
		const headings = context.query.split('|')[0].split('#');
		let notename = headings[0];
		
		// support title property
		if (this.plugin.settings.titleProperty) {
			notename = this.plugin.getTitleFromFile(notename);
		}
		
		let displayText = headings[1];

		if (displayText.startsWith('^')) {
			displayText = displayText.slice(1);
		}

		for (let i = 2; i < headings.length; i++) {
			displayText += this.plugin.settings.sep + headings[i];
		}
		
		const suggestion1: AnchorDisplaySuggestion = {
			displayText: displayText,
			source: 'Don\'t include note name',
		}
		const suggestion2: AnchorDisplaySuggestion = {
			displayText: `${notename}${this.plugin.settings.sep}${displayText}`,
			source: 'Note name and than heading(s)',
		}
		const suggestion3: AnchorDisplaySuggestion = {
			displayText: `${displayText}${this.plugin.settings.sep}${notename}`,
			source: 'Heading(s) and than note name',
		}
		return [suggestion1, suggestion2, suggestion3];
	}

	renderSuggestion(value: AnchorDisplaySuggestion, el: HTMLElement) {
		// prompt instructions are a child of the suggestion container, which will
		// be the parent of the parent the element which gets passed to this function
		const suggestionEl = el.parentElement;
		const suggestionContainerEl = suggestionEl!.parentElement;
		// only need to render the prompt instructions once, but renderSuggestion gets called 
		// on each suggestion
		if (suggestionContainerEl!.childElementCount < 2) {
			const promptInstructionsEl = suggestionContainerEl!.createDiv({cls: 'prompt-instructions'});
			const instructionEl = promptInstructionsEl.createDiv({cls: 'prompt-instruction'});
			instructionEl.createEl('span', {cls: 'prompt-instruction-command', text:'↵'});
			instructionEl.createEl('span', {text:'to accept'});
		}
		// class of the passed element will be suggestion-item, but we need suggestion-item mod-complex
		// to get appropriate styling
		el.setAttribute('class', 'suggestion-item mod-complex');
		const suggestionContentEl = el.createDiv({cls: 'suggestion-content'});
		suggestionContentEl.createDiv({cls: 'suggestion-title', text: value.displayText});
		suggestionContentEl.createDiv({cls: 'suggestion-note', text: value.source});
	}

	selectSuggestion(value: AnchorDisplaySuggestion, evt: MouseEvent | KeyboardEvent): void {
		const editor = this.context!.editor;
		// if there is already display text, will need to overwrite it
		const match = this.context!.query.match(RE_DISPLAY);
		if (match) {
			this.context!.start.ch = this.context!.start.ch - match[0].length;
		}
		editor.replaceRange(`|${value.displayText}`, this.context!.start, this.context!.end, 'headerDisplayText');
		this.suggestionSelected = this.context!.end;
	}

	
}

class AnchorDisplayTextSettingTab extends PluginSettingTab {
	plugin: AnchorDisplayText;
	private sepWarning: Notice | null = null;

	constructor(app: App, plugin: AnchorDisplayText) {
		super(app, plugin);
		this.plugin = plugin;
	}

	validateSep(value: string): string {
		let validValue: string = value;

		for (const c of value) {
			if ('[]#^|'.includes(c)) {
				validValue = validValue.replace(c, '');
			}
		}
		if (validValue != value) {
			if (!this.sepWarning) {
				this.sepWarning = new Notice(`Separators cannot contain any of the following characters: []#^|`, 0);
			}
		} else {
			if (this.sepWarning) {
				this.sepWarning!.hide();
				this.sepWarning = null;
			}
		}
		return validValue;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Include note name')
			.setDesc('Include the title of the note in the display text.')
			.addDropdown(dropdown => {
				dropdown.addOption('headersOnly', 'Don\'t include note name');
				dropdown.addOption('noteNameFirst', 'Note name and then heading(s)');
				dropdown.addOption('noteNameLast', 'Heading(s) and then note name');
				dropdown.setValue(this.plugin.settings.includeNoteName);
				dropdown.onChange(value => {
					this.plugin.settings.includeNoteName = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Title property')
			.setDesc('If set, use the value of this property as the note name. (Leave blank to use file name)')
			.addText(text => {
				text.setValue(this.plugin.settings.titleProperty);
				text.onChange(value => {
					this.plugin.settings.titleProperty = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Include subheadings')
			.setDesc('Change which headings and subheadings are in the display text.')
			.addDropdown(dropdown => {
				dropdown.addOption('allHeaders', 'All linked headings');
				dropdown.addOption('lastHeader', 'Last heading only');
				dropdown.addOption('firstHeader', 'First heading only');
				dropdown.setValue(this.plugin.settings.whichHeadings);
				dropdown.onChange(value => {
					this.plugin.settings.whichHeadings = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Separator')
			.setDesc('Choose what to insert between headings instead of #.')
			.addText(text => {
				text.setValue(this.plugin.settings.sep);
				text.onChange(value => {
					this.plugin.settings.sep = this.validateSep(value);
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Enable notifications')
			.setDesc('Have a notice pop up whenever an anchor link is automatically changed.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.includeNotice);
				toggle.onChange(value => {
					this.plugin.settings.includeNotice = value;
					this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Suggest alternatives')
			.setDesc('Have a suggestion window to present alternative display text options when the cursor is directly after an anchor link.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.suggest);
				toggle.onChange(value => {
					this.plugin.settings.suggest = value;
					this.plugin.saveSettings();
					if (!this.plugin.suggestionsRegistered) {
						this.plugin.registerEditorSuggest(new AnchorDisplaySuggest(this.plugin));
						this.plugin.suggestionsRegistered = true;
					}
				});
			});

		new Setting(containerEl)
			.setName('Ignore embedded files')
			.setDesc('Don\'t add or change display text for embedded files.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.ignoreEmbedded);
				toggle.onChange(value => {
					this.plugin.settings.ignoreEmbedded = value;
					this.plugin.saveSettings();
				});
			});
	}
}