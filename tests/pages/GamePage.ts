import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CellState, Difficulty } from '../data/app';

export class GamePage extends BasePage {
  readonly view: Locator = this.page.getByTestId('view-play');
  readonly board: Locator = this.page.getByTestId('board');
  readonly status: Locator = this.page.getByTestId('status');
  readonly difficultySelect: Locator = this.page.getByTestId('select-difficulty');
  readonly newGameButton: Locator = this.page.getByTestId('btn-new');
  readonly hintButton: Locator = this.page.getByTestId('btn-hint');
  readonly resetButton: Locator = this.page.getByTestId('btn-reset');

  cell(index: number): Locator {
    return this.page.getByTestId(`cell-${index}`);
  }

  get cells(): Locator {
    return this.page.locator('[data-testid^="cell-"]');
  }

  get hintedCell(): Locator {
    return this.page.locator('.cell.is-hint');
  }

  get winningCells(): Locator {
    return this.page.locator('.cell.is-win');
  }

  async clickCell(index: number): Promise<void> {
    await this.cell(index).click();
  }

  async chooseDifficulty(difficulty: Difficulty): Promise<void> {
    await this.difficultySelect.selectOption(difficulty);
  }

  async clickNewGame(): Promise<void> {
    await this.newGameButton.click();
  }

  async clickReset(): Promise<void> {
    await this.resetButton.click();
  }

  async clickHint(): Promise<void> {
    await this.hintButton.click();
  }

  async boardState(): Promise<CellState[]> {
    return this.cells.evaluateAll((cells) =>
      cells.map((cell) => (cell as HTMLElement).dataset.state as CellState),
    );
  }

  statusName(): Promise<string | null> {
    return this.status.getAttribute('data-status');
  }

  /** The board is locked while the computer moves, so every action waits it out. */
  async waitForComputer(): Promise<void> {
    await expect(this.status).not.toHaveAttribute('data-status', 'computer-thinking');
  }
}
