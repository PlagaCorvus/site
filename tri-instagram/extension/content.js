// Tri Instagram — pont entre la page et l'extension.
// Actif seulement sur une page dont le titre est « Tri Instagram ». Relaie
// les demandes d'image de la page vers l'extension, et les réponses en retour.

(function () {
  if (!/Tri Instagram/.test(document.title)) return;
  const version = chrome.runtime.getManifest().version;
  function ready() {
    chrome.runtime.sendMessage({ type: 'tri-ig-status' }, st => {
      window.postMessage({ triIg: 'ready', version, status: st || null }, '*');
    });
  }
  window.addEventListener('message', ev => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.triIg !== 'fetch' || !d.href) return;
    chrome.runtime.sendMessage({ type: 'tri-ig-fetch', href: d.href }, res => {
      const out = res || { ok: false, error: (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'extension muette' };
      window.postMessage(Object.assign({ triIg: 'result', id: d.id, href: d.href }, out), '*');
    });
  });
  document.addEventListener('tri-ig-ping', ready);
  ready();
})();
