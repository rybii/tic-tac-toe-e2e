import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';
import { Language } from '../data/app';

export class HeaderPanel extends BasePage {
  readonly title: Locator = this.page.getByTestId('title');
  readonly subtitle: Locator = this.page.getByTestId('subtitle');
  readonly languageSelect: Locator = this.page.getByTestId('select-language');
  readonly themeButton: Locator = this.page.getByTestId('btn-theme');

  async selectLanguage(language: Language): Promise<void> {
    await test.step(`Switch language to "${language}"`, async () => {
      await this.languageSelect.selectOption(language);
    });
  }

  async toggleTheme(): Promise<void> {
    await test.step('Toggle theme', async () => {
      await this.themeButton.click();
    });
  }

  currentTheme(): Promise<string | null> {
    return this.page.locator('html').getAttribute('data-theme');
  }

  textDirection(): Promise<string | null> {
    return this.page.locator('html').getAttribute('dir');
  }
}
