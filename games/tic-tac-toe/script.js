// Tic-Tac-Toe. Everything is wrapped in a function so nothing leaks into the global scope
(() => {
    'use strict';

    const WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6],            // diagonals
    ];

    const boardEl = document.getElementById('board');
    const statusEl = document.getElementById('status');
    const scoreEls = {
        X: document.getElementById('score-x'),
        O: document.getElementById('score-o'),
        D: document.getElementById('score-d'),
    };

    let cells = Array(9).fill('');
    let current = 'X';
    let firstPlayer = 'X';
    let over = false;
    const scores = { X: 0, O: 0, D: 0 };

    // This builds the nine buttons
    const buttons = cells.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cell';
        b.addEventListener('click', () => play(i));
        boardEl.append(b);
        return b;
    });

    function label(i) {
        const row = Math.floor(i / 3) + 1;
        const col = (i % 3) + 1;
        return `Row ${row}, column ${col}, ${cells[i] || 'empty'}`;
    }

    function winningLine() {
        return WIN_LINES.find(([a, b, c]) => cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) || null;
    }

    function draw() {
        buttons.forEach((b, i) => {
            b.textContent = cells[i];
            b.className = 'cell' + (cells[i] ? ' ' + cells[i].toLowerCase() : '');
            b.disabled = over || cells[i] !== '';
            b.setAttribute('aria-label', label(i));
        });
        scoreEls.X.textContent = scores.X;
        scoreEls.O.textContent = scores.O;
        scoreEls.D.textContent = scores.D;
    }

    function play(i) {
        if (over || cells[i]) return;
        cells[i] = current;

        const line = winningLine();
        if (line) {
            over = true;
            scores[current]++;
            draw();
            line.forEach((n) => buttons[n].classList.add('win'));
            statusEl.textContent = `${current} wins!`;
            return;
        }
        if (cells.every(Boolean)) {
            over = true;
            scores.D++;
            draw();
            statusEl.textContent = "It's a draw.";
            return;
        }
        current = current === 'X' ? 'O' : 'X';
        statusEl.textContent = `${current}'s turn`;
        draw();
    }

    function newRound() {
        cells = Array(9).fill('');
        over = false;
        firstPlayer = firstPlayer === 'X' ? 'O' : 'X'; // take turns going first
        current = firstPlayer;
        statusEl.textContent = `${current}'s turn`;
        draw();
    }

    document.getElementById('new-round').addEventListener('click', newRound);
    document.getElementById('reset').addEventListener('click', () => {
        scores.X = scores.O = scores.D = 0;
        firstPlayer = 'O'; // newRound flips it back to X
        newRound();
    });

    statusEl.textContent = "X's turn";
    draw();
})();
