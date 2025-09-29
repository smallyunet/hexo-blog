---
title: smallyu的微博
date: 2020-07-25 12:57:38
type: display
---

<div id="microblog"></div>

<script>
// Render micro-blog items from yearly JSON files next to this index.html
(function () {
	const years = [2025, 2024, 2023, 2022, 2021, 2020]; // Newest first
	const container = document.getElementById('microblog');
	container.setAttribute('aria-busy', 'true');

	// Show a lightweight loader while fetching
	const loader = h('div', { class: 'mb-loading', 'aria-live': 'polite' }, 'Loading…');
	container.appendChild(loader);

	// DOM helper
	function h(tag, attrs = {}, ...children) {
		const el = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs || {})) {
			if (v == null) continue;
			if (k === 'class') el.className = v;
			else if (k === 'html') el.innerHTML = v; // only used with trusted content
			else el.setAttribute(k, v);
		}
		for (const c of children) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
		return el;
	}

	// Format ISO date to local YYYY-MM-DD HH:mm
	function formatDate(iso) {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			if (isNaN(d.getTime())) return iso;
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			const hh = String(d.getHours()).padStart(2, '0');
			const mm = String(d.getMinutes()).padStart(2, '0');
			return `${y}-${m}-${day} ${hh}:${mm}`;
		} catch { return iso }
	}

	// Create a safe fragment with URLs linkified, preserving newlines
	function linkify(text) {
		const frag = document.createDocumentFragment();
		let last = 0;
		const re = /https?:\/\/[^\s]+/g;
		let m;
		while ((m = re.exec(text))) {
			const url = m[0].replace(/[),.;!?]+$/, ''); // trim common trailing punctuation
			if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
			const a = document.createElement('a');
			a.href = url;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';
			a.textContent = url;
			frag.appendChild(a);
			last = m.index + m[0].length;
		}
		if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
		return frag;
	}

	// Stable id based on created_at for deep links
	function idFromDate(iso) {
		if (!iso) return '';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const pad = n => String(n).padStart(2, '0');
		return `t-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
	}

	function renderItem(item) {
		// Your JSON items look like GitHub issue comments; use created_at/body/html_url
		const dateText = formatDate(item.created_at);
		const dateEl = h('div', { class: 'mb-date' }, dateText);

		const bodyWrap = h('div', { class: 'mb-text' });
		bodyWrap.appendChild(linkify(String(item.body || '')));

		const link = item.html_url ? h('a', { href: item.html_url, target: '_blank', rel: 'noopener noreferrer' }, 'source') : null;
		const footer = link ? h('div', { class: 'mb-footer' }, link) : h('div');

		const id = idFromDate(item.created_at);
		const itemEl = h('div', { class: 'mb-item' }, dateEl, bodyWrap, footer);
		if (id) itemEl.id = id;
		return itemEl;
	}

	async function loadYear(year) {
		const res = await fetch(`./${year}.json`, { cache: 'no-store' });
		if (!res.ok) throw new Error(`Failed to load ${year}.json`);
		const data = await res.json();

		const header = h('h3', { class: 'mb-year-title', id: `year-${year}` }, String(year));
		const items = Array.isArray(data) ? data.map(renderItem) : [];
		const section = h('section', { class: 'mb-year' }, header, ...items);
		container.appendChild(section);
	}

	(async () => {
		for (const y of years) {
			try { await loadYear(y); }
			catch (err) {
				console.error(err);
				container.appendChild(h('div', { class: 'mb-error' }, `Load ${y} failed.`));
			}
		}
		// Hide loader and mark ready
		loader.remove();
		container.removeAttribute('aria-busy');
		// If arriving with a hash, try to scroll to it after content is ready
		if (location.hash) {
			const target = document.getElementById(location.hash.slice(1));
			if (target) target.scrollIntoView();
		}
	})();
})();
</script>

<noscript>Micro-blog requires JavaScript to load data.</noscript>

<style>
/* Scoped styles for Micro-blog page only; no theme overrides */
#microblog {
	/* Local color system with dark-mode fallbacks */
	--mb-bg: #ffffff;
	--mb-text: #111827; /* gray-900 */
	--mb-subtext: #6b7280; /* gray-500 */
	--mb-border: #e5e7eb; /* gray-200 */
	--mb-link: #2563eb; /* blue-600 */
	--mb-surface: #f9fafb; /* gray-50 */
	--mb-sticky-top: 64px; /* account for fixed navbar if any */

	max-width: 860px;
	margin: 0 auto;
	padding: 8px 16px 40px;
	color: var(--mb-text);
}

@media (prefers-color-scheme: dark) {
	#microblog {
		--mb-bg: #111827;
		--mb-text: #e5e7eb;
		--mb-subtext: #9ca3af;
		--mb-border: #374151;
		--mb-link: #60a5fa;
		--mb-surface: #0b1220;
	}
}

#microblog { display: grid; gap: 20px; }
.mb-loading { color: var(--mb-subtext); font-size: 0.95rem; }

.mb-year {
	background: var(--mb-bg);
	border: 1px solid var(--mb-border);
	border-radius: 12px;
	padding: 12px 14px;
}

.mb-year-title {
	position: sticky;
	top: var(--mb-sticky-top);
	z-index: 1;
	background: var(--mb-bg);
	margin: 2px 0 10px;
	padding: 6px 4px;
	font-size: 1.05rem;
	color: var(--mb-subtext);
	border-bottom: 1px solid var(--mb-border);
}

/* Item layout: date column + content column */
.mb-item {
	display: grid;
	grid-template-columns: 140px 1fr;
	column-gap: 16px;
	align-items: start;
	scroll-margin-top: calc(var(--mb-sticky-top) + 12px);
}

.mb-item + .mb-item {
	margin-top: 8px;
	padding-top: 10px;
	border-top: 1px dashed var(--mb-border);
}

.mb-date {
	text-align: right;
	font: 500 0.9rem/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
	color: var(--mb-subtext);
}

.mb-text {
	white-space: pre-wrap;
	margin-top: 2px;
}

.mb-text a {
	color: var(--mb-link);
	text-decoration: none;
}

.mb-text a:hover { text-decoration: underline; }

.mb-footer { grid-column: 2; margin-top: 6px; }
.mb-footer a { color: var(--mb-link); text-decoration: none; }
.mb-footer a:hover { text-decoration: underline; }
.mb-error { color: #b91c1c; }

/* Mobile */
@media (max-width: 640px) {
	.mb-item { grid-template-columns: 108px 1fr; }
	.mb-date { text-align: left; }
}
</style>
