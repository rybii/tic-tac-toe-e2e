import { Page } from '@playwright/test';

/**
 * Difficulty change, clear history and delete account all use confirm().
 * Playwright dismisses dialogs by default, which silently cancels those actions,
 * so every dialog is accepted here unless a test asks for the next one to be cancelled.
 */
export class DialogHandler {
  readonly messages: string[] = [];
  private cancelOnce = false;

  constructor(page: Page) {
    page.on('dialog', async (dialog) => {
      this.messages.push(dialog.message());
      if (this.cancelOnce) {
        this.cancelOnce = false;
        await dialog.dismiss();
      } else {
        await dialog.accept();
      }
    });
  }

  /** Press Cancel on the next confirm instead of OK. */
  cancelNext(): void {
    this.cancelOnce = true;
  }

  get last(): string | undefined {
    return this.messages[this.messages.length - 1];
  }
}
