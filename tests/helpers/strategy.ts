import { CellState, WINNING_LINES } from '../data/app';

const freeCells = (board: CellState[]): number[] =>
  board.map((cell, index) => (cell === 'empty' ? index : -1)).filter((index) => index >= 0);

const firstAvailable = (board: CellState[], order: number[]): number => {
  const free = freeCells(board);
  return order.find((index) => free.includes(index)) ?? free[0];
};

/** Cell that completes a line for the given mark, or -1 when there is none. */
const completingCell = (board: CellState[], mark: CellState): number => {
  for (const line of WINNING_LINES) {
    const marks = line.map((index) => board[index]);
    if (marks.filter((cell) => cell === mark).length === 2 && marks.includes('empty')) {
      return line[marks.indexOf('empty')];
    }
  }
  return -1;
};

/** Take the win, otherwise block, otherwise centre then corners. */
export const moveToWin = (board: CellState[]): number => {
  const win = completingCell(board, 'x');
  if (win >= 0) return win;

  const block = completingCell(board, 'o');
  if (block >= 0) return block;

  return firstAvailable(board, [4, 0, 2, 6, 8, 1, 3, 5, 7]);
};

/** Stay out of the top row and never block, so the computer can finish a line. */
export const moveToLose = (board: CellState[]): number =>
  firstAvailable(board, [4, 5, 7, 8, 3, 6, 1, 0, 2]);
