// Shared by client (display) and server (verification).
export const N = 5;
export const START_PRESSES = [0, 2, 7, 9, 11, 13, 16, 20, 23, 24];

export function press(grid, i) {
  const r = Math.floor(i / N), c = i % N;
  for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < N && cc >= 0 && cc < N) grid[rr * N + cc] ^= 1;
  }
  return grid;
}

export const start = () => START_PRESSES.reduce(press, Array(N * N).fill(0));
