#!/usr/bin/env node
// Runs on every pull request. Makes sure a submission only adds ONE brand-new
// game folder and that the folder is set up correctly.
//
// A maintainer can skip the folder rules by adding the label "maintainer-ok"
// to the pull request (for updates to an existing game, removals, or site changes).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { validateGame, ID_PATTERN } = require('./lib/validate-game');

const root = path.join(__dirname, '..');
const base = process.env.BASE_REF || 'main';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const git = (...args) =>
    execFileSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8' }).trim();

let labels = [];
try {
    const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    labels = (event.pull_request.labels || []).map((l) => l.name);
} catch (_) { /* running locally */ }
const exempt = labels.includes('maintainer-ok');

const diff = git('diff', '--name-status', '--no-renames', `origin/${base}...HEAD`);
const changes = diff
    ? diff.split('\n').map((line) => {
        const [status, ...rest] = line.split('\t');
        return { status, file: rest.join('\t') };
    })
    : [];

const errors = [];
if (changes.length === 0) errors.push('This pull request does not change any files.');

const outside = changes.filter((c) => !c.file.startsWith('games/') || c.file.split('/').length < 3);
const inGames = changes.filter((c) => !outside.includes(c));
const folders = [...new Set(inGames.map((c) => c.file.split('/')[1]))];

if (!exempt) {
    if (outside.length) {
        errors.push(
        'Your pull request changes files outside your game folder:\n    ' +
        outside.slice(0, 8).map((c) => c.file).join('\n    ') +
        '\n  Only add files inside games/<your-game-name>/. If you uploaded the whole project by accident, start again and upload just your game folder.'
        );
    }
    if (folders.length > 1) {
        errors.push(`Your pull request touches ${folders.length} game folders (${folders.join(', ')}). Submit one game per pull request.`);
    }
    for (const f of folders) {
        if (f.startsWith('_')) errors.push(`games/${f}: folders starting with "_" are reserved. Rename your folder.`);
        else if (ID_PATTERN.test(f)) {
        const existing = git('ls-tree', '-d', `origin/${base}`, `games/${f}`);
        if (existing) {
            errors.push(
                `games/${f}: a game with this name already exists, and changes to existing games need a maintainer. ` +
                'If this is your game and you are updating it, ask a maintainer to review. If it is a new game, rename your folder.'
                );
            }
        }
    }
}

// Always check that each game folder in this pull request is set up correctly.
for (const f of folders) {
    const dir = path.join(root, 'games', f);
    if (!fs.existsSync(dir) || f.startsWith('_')) continue;
    errors.push(...validateGame(dir, f).errors);
}

for (const c of changes) {
    if (c.status === 'D') continue;
    const full = path.join(root, c.file);
    if (fs.existsSync(full) && fs.statSync(full).size > MAX_FILE_BYTES) {
        errors.push(`${c.file} is larger than 5 MB. Please shrink it (images and audio are usually the culprits).`);
    }
}

if (errors.length) {
    console.error('\nThis submission needs a few fixes:\n');
    errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}\n`));
    process.exit(1);
}
console.log(
    exempt
        ? 'Maintainer exception applied. Game folders look good.'
        : `Looks good! Adding the new game${folders.length === 1 ? ': ' + folders[0] : ''}.`
);
