import { test } from '@playwright/test';
import { GamePage } from '../pages/GamePage';
import { BOARD_SIZE, CellState, Difficulty, GameResult } from '../data/app';
import { moveToLose, moveToWin } from '../helpers/strategy';

/**
 * Everything a player does with the board, expressed as whole actions.
 * The page object underneath only knows about selectors and single clicks.
 */
export class GameFeature {
  constructor(private readonly gamePage: GamePage) {}

  async selectDifficulty(difficulty: Difficulty): Promise<void> {
    await test.step(`Set difficulty to "${difficulty}"`, async () => {
      await this.gamePage.chooseDifficulty(difficulty);
      await this.gamePage.waitForComputer();
    });
  }

  async mark(index: number): Promise<void> {
    await test.step(`Mark cell ${index}`, async () => {
      await this.gamePage.clickCell(index);
      await this.gamePage.waitForComputer();
    });
  }

  async startNewGame(): Promise<void> {
    await test.step('Start a new game', async () => {
      await this.gamePage.clickNewGame();
      await this.gamePage.waitForComputer();
    });
  }

  async reset(): Promise<void> {
    await test.step('Reset the board', async () => {
      await this.gamePage.clickReset();
      await this.gamePage.waitForComputer();
    });
  }

  async requestHint(): Promise<void> {
    await test.step('Request a hint', async () => this.gamePage.clickHint());
  }

  async playToWin(): Promise<void> {
    await test.step('Play until the player wins', async () => this.playWith(moveToWin));
  }

  async playToLose(): Promise<void> {
    await test.step('Play until the computer wins', async () => this.playWith(moveToLose));
  }

  /** The finished game's result, in the wording the history table uses. */
  async result(): Promise<GameResult> {
    const status = await this.gamePage.statusName();
    const labels: Record<string, GameResult> = {
      human: 'Win',
      computer: 'Loss',
      draw: 'Draw',
    };
    const label = labels[status ?? ''];
    if (!label) throw new Error(`The game has not finished, status is "${status}"`);
    return label;
  }

  async isFinished(): Promise<boolean> {
    const status = await this.gamePage.statusName();
    return status !== null && !['your-turn', 'computer-thinking'].includes(status);
  }

  private async playWith(pickMove: (board: CellState[]) => number): Promise<void> {
    for (let move = 0; move < BOARD_SIZE; move += 1) {
      if (await this.isFinished()) return;
      const board = await this.gamePage.boardState();
      if (!board.includes('empty')) return;
      await this.mark(pickMove(board));
    }
  }
}
