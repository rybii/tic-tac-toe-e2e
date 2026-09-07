export type Language = 'en' | 'fa';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type CellState = 'empty' | 'x' | 'o';
export type GameStatus = 'your-turn' | 'computer-thinking' | 'human' | 'computer' | 'draw';
export type GameResult = 'Win' | 'Loss' | 'Draw';

export const STORAGE_KEYS = {
  users: 'ttt:users',
  session: 'ttt:session',
  theme: 'ttt:theme',
  language: 'ttt:lang',
} as const;

export const BOARD_SIZE = 9;
export const EMPTY_BOARD: CellState[] = Array(BOARD_SIZE).fill('empty');

export const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
