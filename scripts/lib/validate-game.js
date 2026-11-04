// Shared rules for what a valid game folder looks like.
// Used by both the list builder and the pull request checker.
const fs = require('fs');
const path = require('path');

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function validateGame(dir, id) {
    const errors = [];
    const fail = (msg) => errors.push(`games/${id}: ${msg}`);

    if (!ID_PATTERN.test(id)) {
        fail('the folder name must be lowercase letters, numbers, and hyphens only (like "my-cool-game").');
    }
    if (!fs.existsSync(path.join(dir, 'index.html'))) {
        fail('there is no index.html. Your game needs an index.html file directly inside its folder.');
    }

    const jsonPath = path.join(dir, 'game.json');
    let info = null;
    if (!fs.existsSync(jsonPath)) {
        fail('there is no game.json. Copy it from games/_template and fill it in.');
    } else {
        try {
            info = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } catch (e) {
        fail('game.json is not valid JSON (' + e.message + '). Check for a missing quote or comma.');
        }
    }
    if (!info) return { errors, game: null };

    const text = (field, max) => {
        const v = info[field];
        if (typeof v !== 'string' || !v.trim()) { fail(`game.json needs a "${field}".`); return ''; }
        if (v.trim().length > max) fail(`"${field}" is too long (max ${max} characters).`);
        return v.trim();
    };
    const title = text('title', 40);
    const author = text('author', 40);
    const description = text('description', 160);

    let tags = [];
    if (info.tags !== undefined) {
        if (!Array.isArray(info.tags) || info.tags.some((t) => typeof t !== 'string')) {
            fail('"tags" must be a list of words, like ["puzzle", "2-player"].');
        } else {
            tags = info.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
        if (tags.length > 5) fail('use at most 5 tags.');
        if (tags.some((t) => t.length > 20)) fail('each tag must be 20 characters or fewer.');
        }
    }

    let thumbnail = null;
    if (info.thumbnail) {
        const full = path.resolve(dir, String(info.thumbnail));
        if (!full.startsWith(path.resolve(dir) + path.sep)) {
            fail('"thumbnail" must be a file inside your own folder.');
        } else if (!fs.existsSync(full)) {
            fail(`"thumbnail" says "${info.thumbnail}" but that file is not in your folder.`);
        } else {
            thumbnail = String(info.thumbnail).replace(/\\/g, '/');
        }
    }

    return {
        errors,
        game: errors.length ? null : { id, title, author, description, tags, thumbnail, path: `games/${id}/` },
    };
    }

    module.exports = { validateGame, ID_PATTERN };
