#!/usr/bin/env node
// Scans games/*/game.json and writes games.json for the portfolio page.
// Runs automatically when the site is deployed, but this can also be ran locally:
//   node scripts/build-games-list.js
const fs = require('fs');
const path = require('path');
const { validateGame } = require('./lib/validate-game');

const root = path.join(__dirname, '..');
const gamesDir = path.join(root, 'games');
const games = [];
let skipped = 0;

for (const entry of fs.readdirSync(gamesDir, { withFileTypes: true })) {
  // Folders starting with "_" (like _template) or "." are never shown on the site.
    if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const { errors, game } = validateGame(path.join(gamesDir, entry.name), entry.name);
    if (game) games.push(game);
    else { skipped++; errors.forEach((e) => console.warn('SKIPPED  ' + e)); }
}

games.sort((a, b) => a.title.localeCompare(b.title));
fs.writeFileSync(path.join(root, 'games.json'), JSON.stringify(games, null, 2) + '\n');
console.log(`Wrote games.json with ${games.length} game(s)` + (skipped ? ` (${skipped} skipped, see above)` : '') + '.');
