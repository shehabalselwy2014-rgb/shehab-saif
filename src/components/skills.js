import { esc } from './util.js';

// Renders the technical skills & systems grid. Shares the expertise-card
// visual language so it sits naturally beside the capability map.
export function renderSkills(items, container) {
  container.innerHTML = items.map((item) => `
    <div class="expertise-card fade-in">
      <div class="expertise-icon"><i class="${esc(item.icon)}"></i></div>
      <div class="expertise-title" data-ar="${esc(item.title.ar)}" data-en="${esc(item.title.en)}">${esc(item.title.ar)}</div>
      <div class="expertise-desc" data-ar="${esc(item.desc.ar)}" data-en="${esc(item.desc.en)}">${esc(item.desc.ar)}</div>
    </div>`).join('');
}
