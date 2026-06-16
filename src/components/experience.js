import { esc } from './util.js';

// Renders the career timeline. Click-to-expand is preserved via the same
// inline toggle the original markup used.
export function renderExperience(items, container) {
  container.innerHTML = items.map((item) => `
    <div class="timeline-item fade-in" onclick="this.classList.toggle('active')">
      <div class="timeline-dot"></div>
      <span class="timeline-date">${esc(item.date)}</span>
      <div class="timeline-title" data-ar="${esc(item.title.ar)}" data-en="${esc(item.title.en)}">${esc(item.title.ar)}</div>
      <div class="timeline-company">${esc(item.company)}</div>
      <div class="timeline-body"><ul>${item.points.map((p) => `<li data-ar="${esc(p.ar)}" data-en="${esc(p.en)}">${esc(p.ar)}</li>`).join('')}</ul></div>
    </div>`).join('');
}
