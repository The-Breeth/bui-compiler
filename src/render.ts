import { ParsedAST } from './types';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderAstToHtml(ast: ParsedAST): string {
  const profile = ast.profile;
  const profileHtml = `<section class="profile"><h1>${escapeHtml(profile.name)}</h1><p>${escapeHtml(profile.description || '')}</p></section>`;
  const bPodsHtml = ast.bPods
    .map(bp => `<section class="bpod"><h2>${escapeHtml(bp.name)}</h2></section>`)
    .join('\n');
  return `${profileHtml}\n${bPodsHtml}`;
}
