// Portfolio page: loads games.json, then shows it as a gallery or list,
// with search and tag filters. Games open inside a sandboxed iframe.
(() => {
    'use strict';

    const $ = (sel) => document.querySelector(sel);
    const els = {
        search: $('#search'), tags: $('#tags'), count: $('#count'), list: $('#games'),
        empty: $('#empty'), emptyMsg: $('#empty-msg'), clear: $('#clear'), total: $('#total'),
        dialog: $('#player'), frame: $('#frame'), title: $('#player-title'),
        author: $('#player-author'), desc: $('#player-desc'), close: $('#player-close'),
    };

    let games = [];
    let query = '';
    let activeTag = null;

  // ---------- helpers ----------
  // Text from game.json is written by members, so we only ever use
  // textContent (never innerHTML). That keeps one person's text from breaking the page.
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function tileFor(id) {
        let h = 0;
        for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return 'tile-' + (h % 5);
    }

    function normalize(raw) {
        const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).toLowerCase()) : [];
        return {
            id: String(raw.id),
            title: String(raw.title),
            author: String(raw.author),
            description: String(raw.description),
            tags,
            path: String(raw.path),
            thumbnail: raw.thumbnail ? String(raw.thumbnail) : null,
            haystack: [raw.title, raw.author, raw.description, ...tags].join(' ').toLowerCase(),
        };
    }

  // ---------- rendering ----------
    function thumbFor(game) {
        const box = el('div', 'thumb ' + tileFor(game.id));
        const letter = () => box.replaceChildren(document.createTextNode(game.title.charAt(0).toUpperCase()));
        if (game.thumbnail) {
            const img = document.createElement('img');
            img.alt = '';
            img.loading = 'lazy';
            img.src = game.path + game.thumbnail;
            img.addEventListener('error', letter);
            box.append(img);
        } else {
            letter();
        }
        return box;
    }

    function cardFor(game) {
        const card = el('a', 'card');
        card.href = '#' + encodeURIComponent(game.id);

        const body = el('div', 'card-body');
        body.append(el('h3', '', game.title), el('p', 'by', 'by ' + game.author), el('p', 'card-desc', game.description));
        if (game.tags.length) {
            const pills = el('div', 'pills');
            game.tags.forEach((t) => pills.append(el('span', 'pill', t)));
            body.append(pills);
        }
        card.append(thumbFor(game), body);
    return card;
    }

    function matches(game) {
        if (activeTag && !game.tags.includes(activeTag)) return false;
        return !query || game.haystack.includes(query);
    }

    function render() {
        const shown = games.filter(matches);
        els.list.replaceChildren(...shown.map(cardFor));

        const none = shown.length === 0;
        els.list.hidden = none;
        els.empty.hidden = !none;
        els.clear.hidden = !(query || activeTag);

        if (none) {
            els.emptyMsg.textContent = games.length === 0
                ? 'No games here yet. Yours could be the first one.'
                : 'No games match your search.';
        }
        els.count.textContent = games.length === 0 ? '' :
        shown.length === games.length
            ? `${games.length} ${games.length === 1 ? 'game' : 'games'}`
            : `Showing ${shown.length} of ${games.length}`;
    }

    function renderTags() {
        const all = [...new Set(games.flatMap((g) => g.tags))].sort();
        els.tags.hidden = all.length === 0;
        const make = (label, value) => {
            const b = el('button', 'chip', label);
            b.type = 'button';
            b.dataset.tag = value ?? '';
            b.setAttribute('aria-pressed', String(activeTag === value));
            return b;
        };
        els.tags.replaceChildren(make('All', null), ...all.map((t) => make(t, t)));
    }

    function syncTagButtons() {
        els.tags.querySelectorAll('.chip').forEach((b) => {
            const value = b.dataset.tag || null;
            b.setAttribute('aria-pressed', String(value === activeTag));
        });
    }

  // ---------- events ----------
    els.search.addEventListener('input', () => {
        query = els.search.value.trim().toLowerCase();
        render();
    });

    els.tags.addEventListener('click', (e) => {
        const b = e.target.closest('.chip');
        if (!b) return;
        activeTag = b.dataset.tag || null;
        syncTagButtons();
        render();
    });

    els.clear.addEventListener('click', () => {
        query = '';
        activeTag = null;
        els.search.value = '';
        syncTagButtons();
        render();
        els.search.focus();
    });

    document.querySelectorAll('input[name="view"]').forEach((radio) => {
        radio.addEventListener('change', () => setView(radio.value));
    });

    function setView(view) {
        els.list.className = 'games view-' + view;
        const radio = document.querySelector(`input[name="view"][value="${view}"]`);
        if (radio) radio.checked = true;
        try { localStorage.setItem('portfolio-view', view); } catch (_) { /* storage can be blocked */ }
    }

  // ---------- game player (the link looks like #tic-tac-toe) ----------
    function openGame(game) {
        els.title.textContent = game.title;
        els.author.textContent = 'by ' + game.author;
        els.desc.textContent = game.description;
        const src = game.path + 'index.html';
        if (els.frame.getAttribute('src') !== src) els.frame.src = src;
        els.frame.title = game.title;
        if (!els.dialog.open) els.dialog.showModal();
    }

    function route() {
        let id = '';
        try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* bad link */ }
        const game = games.find((g) => g.id === id);
        if (game) openGame(game);
        else if (els.dialog.open) els.dialog.close();
    }

    els.close.addEventListener('click', () => els.dialog.close());
    els.dialog.addEventListener('click', (e) => { if (e.target === els.dialog) els.dialog.close(); });
    els.dialog.addEventListener('close', () => {
        els.frame.src = 'about:blank'; // stops the game
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    });
    window.addEventListener('hashchange', route);

  // ---------- start ----------
    async function start() {
        try {
            const res = await fetch('games.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            games = (await res.json()).map(normalize);
        } catch (err) {
            els.list.hidden = true;
            els.empty.hidden = false;
            els.emptyMsg.textContent = 'Could not load the game list. If you are testing on your computer, ' +
                'run "node scripts/build-games-list.js" first and open the page through a local server (see SETUP.md).';
            return;
        }
        els.total.textContent = games.length ? `${games.length} and counting.` : '';
        let saved = null;
        try { saved = localStorage.getItem('portfolio-view'); } catch (_) { /* ignore */ }
        setView(saved === 'list' ? 'list' : 'gallery');
        renderTags();
        render();
        route();
    }

    start();
})();
