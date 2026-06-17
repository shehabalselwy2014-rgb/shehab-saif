import { esc } from './util.js';

// Renders the career timeline. Each entry is an expandable disclosure; the
// click/keyboard wiring and aria-expanded state are managed in main.js so the
// entries are reachable by keyboard, not mouse only.
export function renderExperience(items, container) {
  container.innerHTML = items.map((item) => `
    <div class="timeline-item fade-in" role="button" tabindex="0" aria-expanded="false">
      <div class="timeline-dot"></div>
      <span class="timeline-date">${esc(item.date)}</span>
      <div class="timeline-title" data-ar="${esc(item.title.ar)}" data-en="${esc(item.title.en)}">${esc(item.title.ar)}</div>
      <div class="timeline-company">${esc(item.company)}</div>
      <div class="timeline-body"><ul>${item.points.map((p) => `<li data-ar="${esc(p.ar)}" data-en="${esc(p.en)}">${esc(p.ar)}</li>`).join('')}</ul></div>
    </div>`).join('');
}
