(() => {
  let installPrompt;
  const installButton = document.getElementById('btnInstall');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event; installButton.classList.remove('hidden');
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null; installButton.classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => installButton.classList.add('hidden'));
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !navigator.serviceWorker.controller) return;
    // First installation claims this page without reloading it.
    if (!hadController) { hadController = true; return; }
    const reloadWhenIdle = () => {
      if (isAnimating || solving) { setTimeout(reloadWhenIdle, 100); return; }
      refreshing = true;
      try { sessionStorage.setItem('rubik-resume', JSON.stringify({facelets,paintedMask,selectedColor,inSolveMode,solutionMoves,solutionStep})); } catch {}
      location.reload();
    };
    reloadWhenIdle();
  });
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'}).then(registration => {
    const offerUpdate = () => {
      if (registration.waiting && navigator.serviceWorker.controller) document.getElementById('pwaNotice').classList.remove('hidden');
    };
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) document.getElementById('pwaNotice').classList.remove('hidden');
      });
    });
    document.getElementById('btnUpdate').addEventListener('click', () => {
      stopAuto();
      registration.waiting?.postMessage('SKIP_WAITING');
      document.getElementById('pwaNotice').classList.add('hidden');
    });
    const checkUpdate = () => { if (navigator.onLine) registration.update().catch(() => {}); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
    window.addEventListener('online', checkUpdate);
    setInterval(checkUpdate, 60 * 60 * 1000);
  }).catch(() => { /* App remains usable when storage or offline installation is unavailable. */ });
})();
