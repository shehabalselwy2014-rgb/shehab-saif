import { esc } from './util.js';

// Renders the insights / articles cards.
export function renderArticles(items, container) {
  container.innerHTML = items.map((item) => `
    <div class="insight-card fade-in">
      <div class="insight-img"><i class="${esc(item.icon)}"></i></div>
      <div class="insight-body">
        <span class="insight-tag" data-ar="${esc(item.tag.ar)}" data-en="${esc(item.tag.en)}">${esc(item.tag.ar)}</span>
        <div class="insight-title" data-ar="${esc(item.title.ar)}" data-en="${esc(item.title.en)}">${esc(item.title.ar)}</div>
        <div class="insight-meta"><span><i class="far fa-calendar"></i> ${esc(item.year)}</span><span><i class="far fa-clock"></i> ${esc(item.readTime)}</span></div>
      </div>
    </div>`).join('');
}
