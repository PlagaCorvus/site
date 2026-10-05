// Tri Instagram — service d'arrière-plan.
// Reçoit une adresse de publication, la lit avec la session Instagram de
// l'utilisateur, extrait l'image d'aperçu (balise og:image) et la renvoie.
// Une requête à la fois, espacées d'au moins 600 ms : le rythme d'une
// personne qui navigue, jamais celui d'un robot.

const file = [];
let busy = false;
let last = 0;
const GAP = 600;

function extractMeta(html, prop) {
  const re1 = new RegExp('<meta[^>]+property=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\']', 'i');
  const re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']' + prop + '["\']', 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(s);
}

async function fetchPost(href) {
  const url = String(href).replace(/[?#].*$/, '').replace(/\/+$/, '') + '/';
  const r = await fetch(url, { credentials: 'include', redirect: 'follow', headers: { 'Accept': 'text/html' } });
  if (/\/accounts\/login/.test(r.url)) return { ok: false, error: 'non connecté : ouvrez instagram.com et connectez-vous' };
  if (!r.ok) return { ok: false, error: 'Instagram répond ' + r.status };
  const html = await r.text();
  const image = extractMeta(html, 'og:image');
  if (!image) return { ok: false, error: 'aucune image d\'aperçu dans la page' };
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'og:title');
  const video = extractMeta(html, 'og:video');
  const ir = await fetch(image, { credentials: 'omit' });
  if (!ir.ok) return { ok: false, error: 'image refusée (' + ir.status + ')' };
  const type = ir.headers.get('content-type') || 'image/jpeg';
  const buf = await ir.arrayBuffer();
  return { ok: true, dataUrl: 'data:' + type + ';base64,' + toBase64(buf), description, isVideo: !!video };
}

async function pump() {
  if (busy) return;
  busy = true;
  while (file.length) {
    const { href, respond } = file.shift();
    const wait = Math.max(0, last + GAP - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    last = Date.now();
    try { respond(await fetchPost(href)); }
    catch (e) { respond({ ok: false, error: (e && e.message) || 'erreur' }); }
  }
  busy = false;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'tri-ig-fetch' || !msg.href) return false;
  if (!/^https:\/\/www\.instagram\.com\//.test(msg.href)) { sendResponse({ ok: false, error: 'adresse non Instagram' }); return false; }
  file.push({ href: msg.href, respond: sendResponse });
  pump();
  return true; // réponse asynchrone
});
