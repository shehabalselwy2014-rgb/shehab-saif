import { esc } from './util.js';

// Renders the "Measurable Impact" counter cards. Each card keeps the
// data-target / impact-number contract the counter animation relies on.
export function renderAchievements(items, container) {
  container.innerHTML = items.map((item) => `
    <div class="impact-card fade-in">
      <div class="impact-icon"><i class="${esc(item.icon)}"></i></div>
      <div class="impact-number" data-target="${esc(item.target)}">0</div>
      <div class="impact-label" data-ar="${esc(item.ar)}" data-en="${esc(item.en)}">${esc(item.ar)}</div>
    </div>`).join('');
}
