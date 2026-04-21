// ==UserScript==
// @name         LinkedIn Games Solvers
// @namespace    http://tampermonkey.net/
// @version      2026-04-11
// @description  Algorithmic solvers for (some) LinkedIn daily games.
// @author       Mert Luleci
// @match        https://www.linkedin.com/games/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// ==/UserScript==

function find(f) {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const elements = Array.from(f());
      if (elements.length > 0) {
        observer.disconnect();
        resolve(elements);
      }
    });
    observer.observe(document, {
      subtree: true,
      childList: true,
    });
  });
}

function gridify(array, n) {
  return array.reduce((acc, val) => {
    const last = acc.at(-1);
    if (last?.length < n) {
      last.push(val);
    } else {
      acc.push([val]);
    }
    return acc;
  }, []);
}

async function queens() {
  const cells = await find(() => document.getElementsByClassName("e500c0d3"));
  const N = 8;
  const colors = Array.from(cells).map((c) => c.ariaLabel.split(",")[0]);

  const property = (perm) => {
    for (let k = 0; k < perm.length; k++) {
      if (k > 0 && Math.abs(perm[k] - perm[k - 1]) == 1) {
        return false; // Touching
      }
      for (let j = 0; j < perm.length; j++) {
        if (j < k) {
          if (perm[k] == perm[j]) {
            return false; // On the same row
          } else if (colors[k + perm[k] * N] == colors[j + perm[j] * N]) {
            return false; // In the same region
          }
        }
      }
    }
    return true;
  };

  const extend = (perm) => {
    const new_perm = [];
    for (const p of perm) {
      for (let i = 0; i < N; i++) {
        new_perm.push(p.concat([i]));
      }
    }
    return new_perm;
  };

  const solve = () => {
    let perm = [[]];
    for (let i = 0; i < N; i++) {
      perm = extend(perm).filter(property);
    }
    return perm[0];
  };

  console.time("queens");
  const answer = solve();
  console.timeEnd("queens");
  console.log("solution:", answer);
}

async function sudoku() {
  const cells = await find(() =>
    document.getElementsByClassName("sudoku-cell-content"),
  );
  const board = gridify(
    cells.map((c) => parseInt(c.innerText) || 0),
    6,
  );

  const search = (board, x, y) => {
    let j = x;
    for (let i = y; i < 6; i++) {
      for (; j < 6; j++) {
        if (board[i][j] == 0) {
          return { x: j, y: i };
        }
      }
      j = 0;
    }
  };

  const valid = (board, x, y, value) => {
    for (let i = 0; i < 6; i++) {
      if (i != x && board[y][i] == value) {
        return false;
      } else if (i != y && board[i][x] == value) {
        return false;
      }
    }

    const sx = x - (x % 3);
    const sy = y - (y % 2);
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 3; j++) {
        const bx = sx + j;
        const by = sy + i;
        if (bx != x && by != y && board[by][bx] == value) {
          return false;
        }
      }
    }

    return true;
  };

  const solve = (board, x, y) => {
    for (let i = 1; i < 7; i++) {
      if (!valid(board, x, y, i)) {
        continue;
      }
      board[y][x] = i;

      const next = search(board, x, y);
      if (!next) return board;

      const result = solve(board, next.x, next.y);
      if (result) return result;
    }
    board[y][x] = 0;
    return null;
  };

  console.time("sudoku");
  const start = search(board, 0, 0);
  const answer = solve(board, start.x, start.y);
  console.timeEnd("sudoku");
  console.log("solution:", answer);
}

async function tango() {
  const cells = await find(() => document.getElementsByClassName("f54a24f3"));
  const labels = { Empty: 0, Sun: 1, Moon: 2 };
  const board = gridify(
    cells.map(
      (c) => labels[c.getElementsByClassName("_9bf5ac88")[0].ariaLabel],
    ),
    6,
  );

  const equals = {};
  const crosses = {};
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const child = cell.getElementsByClassName("afd77ddf")?.[0] ?? null;
    const label = child?.ariaLabel ?? "";
    if (label == "Equal") {
      equals[i] = i + 1;
      equals[i + 1] = i;
    } else if (label == "Cross") {
      crosses[i] = i + 1;
      crosses[i + 1] = i;
    }
  }

  const search = (board, x, y) => {
    let j = x;
    for (let i = y; i < 6; i++) {
      for (; j < 6; j++) {
        if (board[i][j] == 0) {
          return { x: j, y: i };
        }
      }
      j = 0;
    }
  };

  const get = (board, x, y) => {
    if (x < 0 || x >= 6) return 0;
    if (y < 0 || y >= 6) return 0;
    return board[y][x];
  };

  const run = (board, x, y, value) => {
    const f1 = get(board, x + 1, y);
    const f2 = get(board, x + 2, y);
    const b1 = get(board, x - 1, y);
    const b2 = get(board, x - 2, y);
    const u1 = get(board, x, y - 1);
    const u2 = get(board, x, y - 2);
    const d1 = get(board, x, y + 1);
    const d2 = get(board, x, y + 2);

    const f = f1 == f2 && f1 == value;
    const m = f1 == value && value == b1;
    const b = b1 == b2 && b1 == value;
    const u = u1 == u2 && u1 == value;
    const d = d1 == d2 && d1 == value;

    return f || b || u || d || m;
  };

  const valid = (board, x, y, value) => {
    // Symbols not in equal numbers:
    let row = 0;
    let column = 0;
    for (let i = 0; i < 6; i++) {
      if (board[y][i] == value) {
        row++;
      }
      if (board[i][x] == value) {
        column++;
      }
      if (row >= 3 || column >= 3) {
        return false;
      }
    }

    // More than 2 duplicate symbols adjacent:
    if (run(board, x, y, value)) {
      return false;
    }

    // Equals constraints:
    const index = x + 6 * y;
    const eqIndex = equals[index];
    if (eqIndex != undefined) {
      const oX = eqIndex % 6;
      const oY = Math.floor(eqIndex / 6);
      const other = board[oY][oX];
      if (other != 0 && other != value) {
        return false;
      }
    }

    // Cross constraints:
    const crossIndex = crosses[index];
    if (crossIndex != undefined) {
      const oX = crossIndex % 6;
      const oY = Math.floor(crossIndex / 6);
      const other = board[oY][oX];
      if (other != 0 && other == value) {
        return false;
      }
    }

    return true;
  };

  const solve = (board, x, y) => {
    for (let i = 1; i < 3; i++) {
      if (!valid(board, x, y, i)) {
        continue;
      }
      board[y][x] = i;

      const next = search(board, x, y);
      if (!next) return board;

      const result = solve(board, next.x, next.y);
      if (result) return result;
    }
    board[y][x] = 0;
    return null;
  };

  console.time("tango");
  const start = search(board, 0, 0);
  const answer = solve(board, start.x, start.y);
  console.timeEnd("tango");
  console.log("solution:", answer);
}

(function () {
  "use strict";

  const game = window.location.pathname.split("/").at(2);
  switch (game) {
    case "queens":
      queens();
      break;
    case "mini-sudoku":
      sudoku();
      break;
    case "tango":
      tango();
      break;
    default:
      console.warn(`Unknown game "${game}"`);
      break;
  }
})();
