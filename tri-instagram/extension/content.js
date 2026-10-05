// Tri Instagram — pont entre la page et l'extension.
// La page ne peut pas parler à l'extension directement : ce script relaie
// ses demandes et lui renvoie les réponses, uniquement sur la page Tri
// Instagram, reconnue à sa balise de titre.

(function () {
  if (!/Tri Instagram/.test(document.title)) return;
  window.addEventListener('message', ev => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.triIg !== 'fetch' || !d.href) return;
    chrome.runtime.sendMessage({ type: 'tri-ig-fetch', href: d.href }, res => {
      const out = res || { ok: false, error: (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'extension muette' };
      window.postMessage(Object.assign({ triIg: 'result', id: d.id, href: d.href }, out), '*');
    });
  });
  window.postMessage({ triIg: 'ready', version: chrome.runtime.getManifest().version }, '*');
  document.addEventListener('tri-ig-ping', () => window.postMessage({ triIg: 'ready', version: chrome.runtime.getManifest().version }, '*'));
})();
