import { Editor, MarkdownView, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, WordpressPluginSettings, WordpressSettingTab } from './settings';
import { addIcons } from './icons';
import { WordPressPostParams } from './wp-client';
import { getWordPressClient } from './wp-clients';
import { I18n } from './i18n';

export default class WordpressPlugin extends Plugin {

  settings: WordpressPluginSettings;

  i18n: I18n;

  private ribbonWpIcon: HTMLElement | null = null;

  async onload() {
    console.log('loading obsidian-wordpress plugin');

    await this.loadSettings();

    // lang should be load early, but after settings
    this.i18n = new I18n(this.settings.lang);

    addIcons();

    this.updateRibbonIcon();

    this.addCommand({
      id: 'defaultPublish',
      name: this.i18n.t('command_publishWithDefault'),
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const params: WordPressPostParams = {
          status: this.settings.defaultPostStatus,
          commentStatus: this.settings.defaultCommentStatus,
          categories: []
        };
        this.publishPost(params);
      }
    });

    this.addCommand({
      id: 'publish',
      name: this.i18n.t('command_publish'),
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.publishPost();
      }
    });

    this.addSettingTab(new WordpressSettingTab(this.app, this));
  }

  onunload() {
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  updateRibbonIcon(): void {
    const ribbonIconTitle = this.i18n.t('ribbon_iconTitle');
    if (this.settings.showRibbonIcon) {
      if (!this.ribbonWpIcon) {
        this.ribbonWpIcon = this.addRibbonIcon('wp-logo', ribbonIconTitle, () => {
          this.publishPost();
        });
      }
    } else {
      if (this.ribbonWpIcon) {
        this.ribbonWpIcon.remove();
        this.ribbonWpIcon = null;
      }
    }
  }

  private publishPost(defaultPostParams?: WordPressPostParams): void {
    const client = getWordPressClient(this.app, this);
    if (client) {
      client.newPost(defaultPostParams).then();
    }
  }

}
