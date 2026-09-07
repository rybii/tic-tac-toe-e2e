import { Locator, test } from '@playwright/test';
import { BasePage } from './BasePage';

export class HistoryPage extends BasePage {
  readonly view: Locator = this.page.getByTestId('view-history');
  readonly title: Locator = this.page.getByTestId('history-title');
  readonly table: Locator = this.page.getByTestId('history-table');
  readonly emptyMessage: Locator = this.page.getByTestId('history-empty');
  readonly clearButton: Locator = this.page.getByTestId('btn-clear-history');

  get rows(): Locator {
    return this.page.locator('[data-testid^="history-row-"]');
  }

  result(rowIndex: number): Locator {
    return this.page.getByTestId(`history-result-${rowIndex}`);
  }

  difficulty(rowIndex: number): Locator {
    return this.page.getByTestId(`history-difficulty-${rowIndex}`);
  }

  date(rowIndex: number): Locator {
    return this.page.getByTestId(`history-date-${rowIndex}`);
  }

  async clear(): Promise<void> {
    await test.step('Clear game history', async () => {
      await this.clearButton.click();
    });
  }
}
