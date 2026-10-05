// Tri Instagram — service d'arrière-plan.
//
// Reçoit l'adresse d'une publication, la lit avec la session Instagram de
// l'utilisateur, en extrait l'image d'aperçu (balise og:image) et la renvoie.
//
// Garde-fous, dans cet ordre :
//  - une requête à la fois, espacées de 1 à 2 secondes avec une part aléatoire ;
//  - au plus HOURLY_CAP publications par heure glissante ;
//  - dès qu'Instagram répond par une limitation (429, page d'attente ou de
//    vérification), pause de PAUSE_MS, mémorisée même si le navigateur redémarre ;
//  - rien n'est jamais demandé sans que la page le réclame pour une carte affichée.

const CONFIG = { gapMin: 1000, gapMax: 2000, hourlyCap: 200, pauseMs: 6 * 3600 * 1000 };
const state = { queue: [], busy: false, last: 0, times: [], pausedUntil: 0, loaded: false };

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

function isLimited(resp, html) {
  if (resp.status === 429) return true;
  if (/\/challenge\//.test(resp.url || '')) return true;
  return /please wait a few minutes|veuillez patienter quelques minutes|try again later|réessayez plus tard/i.test(html || '');
}

async function loadState() {
  if (state.loaded) return;
  state.loaded = true;
  try {
    const s = await chrome.storage.local.get(['times', 'pausedUntil']);
    state.times = Array.isArray(s.times) ? s.times : [];
    state.pausedUntil = s.pausedUntil || 0;
  } catch (e) {}
}
function saveState() {
  try { chrome.storage.local.set({ times: state.times.slice(-CONFIG.hourlyCap), pausedUntil: state.pausedUntil }); } catch (e) {}
}
function hourCount() {
  const cut = Date.now() - 3600 * 1000;
  state.times = state.times.filter(t => t > cut);
  return state.times.length;
}
function status() {
  return { count: hourCount(), cap: CONFIG.hourlyCap, pausedUntil: state.pausedUntil > Date.now() ? state.pausedUntil : 0 };
}
function fmtTime(ms) {
  const d = new Date(ms);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

async function fetchPost(href) {
  const url = String(href).replace(/[?#].*$/, '').replace(/\/+$/, '') + '/';
  const r = await fetch(url, { credentials: 'include', redirect: 'follow', headers: { 'Accept': 'text/html' } });
  const html = r.ok ? await r.text() : '';
  if (isLimited(r, html)) {
    state.pausedUntil = Date.now() + CONFIG.pauseMs;
    saveState();
    return { ok: false, limited: true, error: 'Instagram demande une pause : reprise possible vers ' + fmtTime(state.pausedUntil) };
  }
  if (/\/accounts\/login/.test(r.url)) return { ok: false, error: 'non connecté : ouvrez instagram.com et connectez-vous' };
  if (!r.ok) return { ok: false, error: 'Instagram répond ' + r.status };
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

/* Traite la file : garde-fous puis requête, une à la fois. */
async function pump() {
  if (state.busy) return;
  state.busy = true;
  await loadState();
  while (state.queue.length) {
    const { href, respond } = state.queue.shift();
    const now = Date.now();
    if (state.pausedUntil > now) {
      respond({ ok: false, limited: true, error: 'pause demandée par Instagram jusqu\'à ' + fmtTime(state.pausedUntil), status: status() });
      continue;
    }
    if (hourCount() >= CONFIG.hourlyCap) {
      const next = state.times[0] + 3600 * 1000;
      respond({ ok: false, capped: true, error: 'plafond de ' + CONFIG.hourlyCap + ' par heure atteint, reprise vers ' + fmtTime(next), status: status() });
      continue;
    }
    const gap = CONFIG.gapMin + Math.random() * (CONFIG.gapMax - CONFIG.gapMin);
    const wait = Math.max(0, state.last + gap - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    state.last = Date.now();
    state.times.push(state.last);
    saveState();
    let res;
    try { res = await fetchPost(href); }
    catch (e) { res = { ok: false, error: (e && e.message) || 'erreur' }; }
    res.status = status();
    respond(res);
  }
  state.busy = false;
}

function enqueue(href) {
  return new Promise(resolve => {
    if (!/^https:\/\/www\.instagram\.com\//.test(href)) { resolve({ ok: false, error: 'adresse non Instagram' }); return; }
    state.queue.push({ href, respond: resolve });
    pump();
  });
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (!msg) return false;
    if (msg.type === 'tri-ig-status') { loadState().then(() => sendResponse(status())); return true; }
    if (msg.type === 'tri-ig-fetch' && msg.href) { enqueue(msg.href).then(sendResponse); return true; }
    return false;
  });
}

if (typeof module !== 'undefined') module.exports = { CONFIG, state, extractMeta, isLimited, enqueue, status, hourCount };
