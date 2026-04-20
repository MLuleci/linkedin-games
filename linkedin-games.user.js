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

function queens() {
    find(() => document.getElementsByClassName('e500c0d3')).then((cells) => {
        const N = 8;
        const colors = Array.from(cells).map((c) => c.ariaLabel.split(',')[0]);

        const property = (perm) => {
            for (let k = 0; k < perm.length; k++) {
                if (k > 0 && Math.abs(perm[k] - perm[k-1]) == 1) {
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

        console.time('queens');
        const answer = solve();
        console.timeEnd('queens');
        console.log('solution:', answer);
    });
}

function sudoku() {
    find(() => document.getElementsByClassName('sudoku-cell-content')).then((cells) => {
        const board = gridify(cells.map((c) => parseInt(c.innerText) || 0), 6);

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

        console.time('sudoku');
        const start = search(board, 0, 0);
        const answer = solve(board, start.x, start.y);
        console.timeEnd('sudoku');
        console.log('solution:', answer);
    });
}

function tango() {
    find(() => document.getElementsByClassName('_73925bac')).then((cells) => {
        const labels = { 'Empty': 0, 'Moon': 1, 'Sun': 2 };
        const board = gridify(cells.map((c) => labels[c.getElementsByClassName('_5d5eb1cc')[0].ariaLabel]), 6);
        console.log(board);
    });
}

(function() {
    'use strict';

    const game = window.location.pathname.split('/').at(2);
    switch (game) {
        case 'queens':
            queens();
            break;
        case 'mini-sudoku':
            sudoku();
            break;
        case 'tango':
            tango();
            break;
        default:
            console.warn(`Unknown game "${game}"`);
            break;
    }
})();