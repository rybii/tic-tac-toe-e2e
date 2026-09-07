import { expect, test } from '../../fixtures/test';
import { BOARD_SIZE, EMPTY_BOARD } from '../../data/app';

/** Journeys that follow a game from the first move to what it leaves behind. */

test('E2E-05 winning run: play, win, see the win recorded and counted', async ({
  player,
  game,
  gameplay,
  nav,
  history,
  profile,
}) => {
  await test.step('the board starts clean and it is the player to move', async () => {
    await gameplay.selectDifficulty('hard');
    await expect(game.cells).toHaveCount(BOARD_SIZE);
    expect(await game.boardState()).toEqual(EMPTY_BOARD);
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');
    await expect(game.status).toHaveText('Your turn (X)');
  });

  await test.step('play to a win', async () => {
    await gameplay.playToWin();
    await expect(game.status).toHaveAttribute('data-status', 'human');
    await expect(game.status).toHaveText('You win!');
    await expect(game.winningCells).toHaveCount(3);
  });

  await test.step('the finished board is fully locked', async () => {
    for (let index = 0; index < BOARD_SIZE; index += 1) {
      await expect(game.cell(index)).toBeDisabled();
    }
  });

  await test.step('the win reaches history and the profile together', async () => {
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText('Win');
    await expect(history.difficulty(0)).toHaveText('Hard');

    await nav.openProfile();
    await expect(profile.wins).toHaveText('1');
    await expect(profile.losses).toHaveText('0');
    await expect(profile.draws).toHaveText('0');
  });

  await test.step('a new game starts clean without touching the record', async () => {
    await nav.openPlay();
    await gameplay.startNewGame();
    expect(await game.boardState()).toEqual(EMPTY_BOARD);
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
  });
});

test('E2E-06 losing run: lose on Hard, then win, both results side by side', async ({
  player,
  game,
  gameplay,
  nav,
  history,
  profile,
}) => {
  await test.step('lose a game on Hard', async () => {
    await gameplay.selectDifficulty('hard');
    await gameplay.playToLose();

    await expect(game.status).toHaveAttribute('data-status', 'computer');
    await expect(game.status).toHaveText('Computer wins.');
  });

  await test.step('the loss is recorded against the right difficulty', async () => {
    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText('Loss');
    await expect(history.difficulty(0)).toHaveText('Hard');
  });

  await test.step('the profile counts a loss and no win', async () => {
    await nav.openProfile();
    await expect(profile.losses).toHaveText('1');
    await expect(profile.wins).toHaveText('0');
  });

  await test.step('a later game is added rather than replacing the loss', async () => {
    await nav.openPlay();
    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    const second = await gameplay.result();

    await nav.openHistory();
    await expect(history.rows).toHaveCount(2);
    await expect(history.result(0)).toHaveText(second);
    await expect(history.difficulty(0)).toHaveText('Easy');
    await expect(history.result(1)).toHaveText('Loss');
  });
});

test('E2E-07 difficulty run: all three levels, with and without the confirm', async ({
  player,
  game,
  gameplay,
  nav,
  history,
  dialogs,
  page,
}) => {
  const played: string[] = [];

  await test.step('changing difficulty mid-game asks first and restarts the board', async () => {
    await gameplay.selectDifficulty('easy');
    await gameplay.mark(4);

    await gameplay.selectDifficulty('medium');
    await expect
      .poll(() => dialogs.messages)
      .toContain('Change difficulty and start a new game?');
    await expect(game.difficultySelect).toHaveValue('medium');
    expect(await game.boardState()).toEqual(EMPTY_BOARD);
  });

  await test.step('the abandoned game was not recorded', async () => {
    await nav.openHistory();
    await expect(history.rows).toHaveCount(0);
    await nav.openPlay();
  });

  await test.step('finish a game on Medium', async () => {
    await gameplay.playToWin();
    played.push(await gameplay.result());
  });

  await test.step('changing difficulty after a finished game does not ask again', async () => {
    const asked = dialogs.messages.length;
    await gameplay.selectDifficulty('hard');

    expect(dialogs.messages).toHaveLength(asked);
    expect(await game.boardState()).toEqual(EMPTY_BOARD);
  });

  await test.step('finish a game on Hard, then one on Easy', async () => {
    await gameplay.playToWin();
    played.push(await gameplay.result());

    await gameplay.selectDifficulty('easy');
    await gameplay.playToWin();
    played.push(await gameplay.result());
  });

  await test.step('history lists all three, newest first, with the right difficulty', async () => {
    await nav.openHistory();
    await expect(history.rows).toHaveCount(3);
    await expect(history.difficulty(0)).toHaveText('Easy');
    await expect(history.difficulty(1)).toHaveText('Hard');
    await expect(history.difficulty(2)).toHaveText('Medium');
    await expect(history.result(0)).toHaveText(played[2]);
    await expect(history.result(1)).toHaveText(played[1]);
    await expect(history.result(2)).toHaveText(played[0]);
  });

  await test.step('the last difficulty is remembered after a reload', async () => {
    await page.reload();
    await expect(game.difficultySelect).toHaveValue('easy');
  });
});

test('E2E-08 turn rules and controls: hint, locking, Reset and New Game', async ({
  player,
  game,
  gameplay,
  nav,
  history,
  page,
}) => {
  await test.step('a hint points at a free cell without playing it', async () => {
    await gameplay.selectDifficulty('easy');
    await gameplay.requestHint();

    await expect(game.hintedCell).toHaveCount(1);
    await expect(game.hintedCell).toHaveAttribute('data-state', 'empty');
    expect(await game.boardState()).toEqual(EMPTY_BOARD);
  });

  await test.step('the board is locked while the computer replies', async () => {
    await game.cell(4).click();

    const locked = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('[data-testid^="cell-"]')] as HTMLButtonElement[];
      const status = document.querySelector('[data-testid=status]') as HTMLElement;
      cells[0].click();
      return {
        status: status.dataset.status,
        allDisabled: cells.every((cell) => cell.disabled),
        board: cells.map((cell) => cell.dataset.state).join(','),
      };
    });

    expect(locked.status).toBe('computer-thinking');
    expect(locked.allDisabled).toBe(true);
    expect(locked.board).toBe('empty,empty,empty,empty,x,empty,empty,empty,empty');
    await game.waitForComputer();
  });

  await test.step('an occupied cell cannot be taken again', async () => {
    await expect(game.cell(4)).toHaveAttribute('data-state', 'x');
    await expect(game.cell(4)).toBeDisabled();
  });

  await test.step('Reset clears the board mid-game and records nothing', async () => {
    await gameplay.reset();
    expect(await game.boardState()).toEqual(EMPTY_BOARD);

    await nav.openHistory();
    await expect(history.rows).toHaveCount(0);
    await nav.openPlay();
  });

  await test.step('finish a game, then New Game keeps the record and clears the board', async () => {
    await gameplay.playToWin();
    const result = await gameplay.result();

    await gameplay.startNewGame();
    expect(await game.boardState()).toEqual(EMPTY_BOARD);

    await nav.openHistory();
    await expect(history.rows).toHaveCount(1);
    await expect(history.result(0)).toHaveText(result);
  });
});
