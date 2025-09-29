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

	// Simple helpers
	function h(tag, attrs = {}, ...children) {
		const el = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs || {})) {
			if (v == null) continue;
			if (k === 'class') el.className = v;
			else if (k === 'html') el.innerHTML = v; // use carefully
			else el.setAttribute(k, v);
		}
		for (const c of children) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
		return el;
	}

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

	function renderItem(item) {
		// Your JSON items look like GitHub issue comments; use created_at/body/html_url
		const dateText = formatDate(item.created_at);
		const dateEl = h('div', { class: 'mb-date' }, dateText);

		// Body may include markdown-like links; keep as plain text here
		const bodyEl = h('div', { class: 'mb-text' }, item.body || '');

		const link = item.html_url ? h('a', { href: item.html_url, target: '_blank', rel: 'noopener noreferrer' }, 'source') : null;
		const footer = link ? h('div', { class: 'mb-footer' }, link) : h('div');

		return h('div', { class: 'mb-item' }, dateEl, bodyEl, footer);
	}

	async function loadYear(year) {
		const res = await fetch(`./${year}.json`, { cache: 'no-store' });
		if (!res.ok) throw new Error(`Failed to load ${year}.json`);
		const data = await res.json();

		const header = h('h3', { class: 'mb-year-title' }, String(year));
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
	})();
})();
</script>

<noscript>Micro-blog requires JavaScript to load data.</noscript>

<style>
/* Minimal styles; independent from theme */
#microblog { display: grid; gap: 18px; }
.mb-year { border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; padding: 14px; }
.mb-year-title { margin: 0 0 8px; font-size: 1.1rem; color: var(--text-2, #374151); }
.mb-item + .mb-item { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-color, #e5e7eb); }
.mb-date { font: 500 0.9rem/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #6b7280; }
.mb-text { white-space: pre-wrap; margin-top: 4px; }
.mb-footer { margin-top: 6px; }
.mb-footer a { color: var(--link-color, #2563eb); text-decoration: none; }
.mb-footer a:hover { text-decoration: underline; }
.mb-error { color: #b91c1c; }
</style>
