// Use Safari's visible area rather than the larger layout viewport.
function fitVisibleViewport() {
  const viewport = window.visualViewport;
  const root = document.documentElement.style;
  root.setProperty('--viewport-width', `${viewport?.width || window.innerWidth}px`);
  root.setProperty('--viewport-height', `${viewport?.height || window.innerHeight}px`);
  root.setProperty('--viewport-left', `${viewport?.offsetLeft || 0}px`);
  root.setProperty('--viewport-top', `${viewport?.offsetTop || 0}px`);
}
fitVisibleViewport();
window.addEventListener('resize', fitVisibleViewport);
window.addEventListener('pageshow', fitVisibleViewport);
window.visualViewport?.addEventListener('resize', fitVisibleViewport);
window.visualViewport?.addEventListener('scroll', fitVisibleViewport);

// Keep the application viewport fixed while preserving single-finger cube rotation.
for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
  document.addEventListener(type, event => event.preventDefault(), {passive:false});
}
document.addEventListener('touchmove', event => {
  if (event.touches.length > 1) event.preventDefault();
}, {passive:false});
document.addEventListener('wheel', event => {
  if (event.ctrlKey || event.metaKey) event.preventDefault();
}, {passive:false});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && ['+', '-', '=', '0'].includes(event.key)) event.preventDefault();
});

    // 3. SUBTLE AUDIO FEEDBACK
    // =========================================================================
    let audioCtx = null;
    function playTick(freq = 280, dur = 0.035) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!audioCtx) audioCtx = new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + dur);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch (e) {}
    }

    // =========================================================================
    // 4. 3D CUBE SCENE (Exact Grubiks Unshaded Crisp Black-Bordered Style)
    // =========================================================================
    // Start with all 54 stickers White (3) just like the video at 00:00 so user can paint right away!
    let facelets = new Array(54).fill(3);
    let paintedMask = new Array(54).fill(false);
    let selectedColor = 5; // Default Green selected (or first tap)
    let inSolveMode = false;
    let solutionMoves = [];
    let solutionStep = 0;
    let isAnimating = false;
    let autoPlayTimer = null;
    let autoStepMs = 1000;
    let showMoveArrows = true;
    let moveArrow = null;
    let solving = false;

    let scene, camera, renderer, cubeGroup, pivotGroup;
    const cubieMeshes = [];
    const stickerMeshes = new Array(54);

    // Rounded-rect sticker shape for authentic Grubiks look
    function createRoundedStickerGeometry(size, radius) {
      const shape = new THREE.Shape();
      const s = size / 2;
      const r = radius;
      shape.moveTo(-s + r, -s);
      shape.lineTo(s - r, -s);
      shape.quadraticCurveTo(s, -s, s, -s + r);
      shape.lineTo(s, s - r);
      shape.quadraticCurveTo(s, s, s - r, s);
      shape.lineTo(-s + r, s);
      shape.quadraticCurveTo(-s, s, -s, s - r);
      shape.lineTo(-s, -s + r);
      shape.quadraticCurveTo(-s, -s, -s + r, -s);
      return new THREE.ShapeGeometry(shape);
    }

    let targetCubeQuat = new THREE.Quaternion();

    function resetCubeOrientation() {
      if (!cubeGroup) return;
      // Keep F squarely in front, R on the right, and L on the left.
      // A small downward tilt reveals U without turning either side toward the viewer.
      cubeGroup.rotation.set(0.46, 0, 0);
      targetCubeQuat.copy(cubeGroup.quaternion);
    }

    function addFaceMarker(sticker, letter) {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 128;
      const context = canvas.getContext('2d');
      context.beginPath();
      context.arc(64, 64, 54, 0, Math.PI * 2);
      context.fillStyle = 'rgba(15, 23, 42, 0.82)';
      context.fill();
      context.font = 'bold 76px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillStyle = '#ffffff';
      context.fillText(letter, 64, 67);
      const texture = new THREE.CanvasTexture(canvas);
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.34),
        new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false})
      );
      marker.position.z = 0.008;
      sticker.add(marker);
    }

    function initThree() {
      const wrap = document.getElementById('canvasWrap');
      const canvas = document.getElementById('rubikCanvas');

      scene = new THREE.Scene();

      const w = wrap.clientWidth || window.innerWidth;
      const h = wrap.clientHeight || window.innerHeight;
      const fov = 34;
      camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
      camera.position.set(0, 0, getOptimalCameraZ(w, h, fov));
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      cubeGroup = new THREE.Group();
      scene.add(cubeGroup);

      // pivotGroup is a child of cubeGroup so layer rotations always happen in the cube's local axes!
      pivotGroup = new THREE.Group();
      cubeGroup.add(pivotGroup);

      resetCubeOrientation();

      // Solid jet-black cubie core for bold black borders between stickers
      const coreGeo = new THREE.BoxGeometry(0.995, 0.995, 0.995);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

      const cubieMap = {};
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const cubie = new THREE.Mesh(coreGeo, coreMat);
            cubie.position.set(x, y, z);
            cubeGroup.add(cubie);
            cubieMeshes.push({ mesh: cubie, homePos: [x, y, z] });
            cubieMap[`${x},${y},${z}`] = cubie;
          }
        }
      }

      const stickerGeo = createRoundedStickerGeometry(0.87, 0.08);

      for (let idx = 0; idx < 54; idx++) {
        const { pos, normal } = getFacelet3D(idx);
        const parentCubie = cubieMap[`${pos[0]},${pos[1]},${pos[2]}`];

        // Flat unshaded MeshBasicMaterial so colors match the video 100%
        const mat = new THREE.MeshBasicMaterial({
          color: COLOR_DEFS[facelets[idx]].threeHex
        });
        const sticker = new THREE.Mesh(stickerGeo, mat);
        sticker.position.set(normal[0] * 0.502, normal[1] * 0.502, normal[2] * 0.502);
        sticker.lookAt(normal[0] * 2, normal[1] * 2, normal[2] * 2);
        sticker.userData = { faceletIndex: idx };
        parentCubie.add(sticker);
        stickerMeshes[idx] = sticker;
        if (idx % 9 === 4) addFaceMarker(sticker, FACE_NAMES[Math.floor(idx / 9)]);
      }

      setupPointerControls(canvas);
      window.addEventListener('resize', onResize);
      new ResizeObserver(onResize).observe(wrap);
      requestAnimationFrame(animateLoop);
    }

    function getOptimalCameraZ(w, h, fov = 34) {
      const aspect = (w && h) ? (w / h) : 1;
      const verticalHalfAngle = fov * Math.PI / 360;
      const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect);
      // Fit the entire cube's bounding sphere even after arbitrary drag rotation.
      return 2.65 * 1.06 / Math.sin(Math.min(verticalHalfAngle, horizontalHalfAngle));
    }

    function onResize() {
      const wrap = document.getElementById('canvasWrap');
      if (!wrap || !renderer || !camera) return;
      const w = wrap.clientWidth || window.innerWidth;
      const h = wrap.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.position.z = getOptimalCameraZ(w, h, camera.fov);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    function animateLoop() {
      if (cubeGroup && targetCubeQuat) {
        cubeGroup.quaternion.slerp(targetCubeQuat, 0.24);
      }
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animateLoop);
    }

    function syncStickers() {
      updateColorCount();
      for (let i = 0; i < 54; i++) {
        if (stickerMeshes[i]) {
          stickerMeshes[i].material.color.setHex(COLOR_DEFS[facelets[i]].threeHex);
        }
      }
    }

    // =========================================================================
    // 5. 360° TRACKBALL DRAG ROTATION & TAP-TO-COLOR STICKERS
    // =========================================================================
    function setupPointerControls(canvas) {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const worldUp = new THREE.Vector3(0, 1, 0);
      const worldRight = new THREE.Vector3(1, 0, 0);

      let isDown = false;
      let activePointerId = null;
      let startX = 0, startY = 0;
      let lastX = 0, lastY = 0;
      let moved = false;

      // Controlled, comfortable rotation speed (less sensitive, smooth & steady)
      const ROTATE_SPEED = 0.0042;
      const TAP_THRESHOLD_PX = 9;

      canvas.addEventListener('pointerdown', (e) => {
        if (isDown || solving) return; // Ignore extra fingers to prevent sudden jumps
        isDown = true;
        activePointerId = e.pointerId;
        moved = false;
        startX = lastX = e.clientX;
        startY = lastY = e.clientY;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!isDown || e.pointerId !== activePointerId) return;
        const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (!moved) {
          if (totalDist > TAP_THRESHOLD_PX) {
            moved = true;
            lastX = e.clientX;
            lastY = e.clientY;
          }
          return;
        }
        // Clamp per-event delta so fast swipes stay smooth and controlled
        const dx = Math.max(-45, Math.min(45, e.clientX - lastX));
        const dy = Math.max(-45, Math.min(45, e.clientY - lastY));
        lastX = e.clientX;
        lastY = e.clientY;

        if (cubeGroup) {
          const qY = new THREE.Quaternion().setFromAxisAngle(worldUp, dx * ROTATE_SPEED);
          const qX = new THREE.Quaternion().setFromAxisAngle(worldRight, dy * ROTATE_SPEED);
          targetCubeQuat.premultiply(qY);
          targetCubeQuat.premultiply(qX);
          targetCubeQuat.normalize();
        }
      });

      function endPointer(e) {
        if (!isDown || e.pointerId !== activePointerId) return;
        isDown = false;
        activePointerId = null;
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}

        // Clean tap: paint the tapped sticker!
        if (!moved && !inSolveMode && !isAnimating && !solving && e.type === 'pointerup') {
          const rect = canvas.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(stickerMeshes, false);
          if (hits.length > 0) {
            const idx = hits[0].object.userData.faceletIndex;
            paintSticker(idx);
          }
        }
      }

      canvas.addEventListener('pointerup', endPointer);
      canvas.addEventListener('pointercancel', endPointer);
    }

    // =========================================================================
    // 6. 3D ANIMATED LAYER ROTATION
    // =========================================================================
    function animateLayerMove(moveIdx, durationMs = 340, onDone = null) {
      if (isAnimating) return;
      isAnimating = true;
      if (moveArrow) moveArrow.visible = false;

      const face = Math.floor(moveIdx / 3);
      const pow = moveIdx % 3; // 0: CW 90, 1: 180, 2: CCW 90
      const spec = FACE_3D_SPEC[face];
      const axisIdx = spec.axis === 'x' ? 0 : spec.axis === 'y' ? 1 : 2;
      const mult = pow === 0 ? 1 : pow === 1 ? 2 : -1;
      const targetAngle = spec.cwSign * mult * (Math.PI / 2);

      const layerCubies = [];
      for (const item of cubieMeshes) {
        if (item.homePos[axisIdx] === spec.layer) {
          pivotGroup.attach(item.mesh);
          layerCubies.push(item);
        }
      }

      playTick(240, 0.04);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) durationMs = 1;
      const t0 = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - t0) / durationMs);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        pivotGroup.rotation[spec.axis] = targetAngle * ease;

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          pivotGroup.rotation.set(0, 0, 0);
          for (const item of layerCubies) {
            cubeGroup.attach(item.mesh);
            item.mesh.position.set(item.homePos[0], item.homePos[1], item.homePos[2]);
            item.mesh.rotation.set(0, 0, 0);
          }
          facelets = applyMoveToFacelets(facelets, moveIdx);
          syncStickers();
          isAnimating = false;
          if (onDone) onDone();
        }
      }
      requestAnimationFrame(tick);
    }

    // =========================================================================
    // 7. SIMPLE UI CONTROLS (Top Color Bar, Reset, Scramble, Solve!, Next/Prev)
    // =========================================================================
    function buildTopPalette() {
      const bar = document.getElementById('paletteBar');
      bar.innerHTML = '';
      PALETTE_ORDER.forEach((colorId) => {
        const c = COLOR_DEFS[colorId];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `colorTile_${colorId}`;
        btn.title = c.name;
        btn.setAttribute('aria-label', c.name);
        btn.setAttribute('aria-pressed', selectedColor === colorId);
        btn.className = `color-tile w-11 h-11 sm:w-13 sm:h-13 rounded-[4px] border border-black/40 ${selectedColor === colorId ? 'color-tile-active' : ''}`;
        btn.style.backgroundColor = c.hex;
        btn.addEventListener('click', () => {
          if (isAnimating || solving) return;
          selectedColor = colorId;
          PALETTE_ORDER.forEach((id) => {
            const el = document.getElementById(`colorTile_${id}`);
            if (el) { el.classList.toggle('color-tile-active', id === colorId); el.setAttribute('aria-pressed', id === colorId); }
          });
          if (isAnimating || solving) return;
          if (inSolveMode) exitSolveMode();
          updateColorCount();
          if (getPaintCounts()[colorId] >= 9) showStatusBanner(`${c.name} sudah cukup 9 petak.`);
          else hideStatusBanner();
          playTick(400, 0.02);
        });
        bar.appendChild(btn);
      });
    }

    function showStatusBanner(msg, showAutoFix = false) {
      const banner = document.getElementById('statusBanner');
      const txt = document.getElementById('statusText');

      txt.textContent = msg;

      banner.classList.remove('hidden');
    }

    function hideStatusBanner() {
      document.getElementById('statusBanner').classList.add('hidden');
    }

    function isSolved(f) {
      for (let face = 0; face < 6; face++) {
        const c = f[face * 9 + 4];
        for (let i = 0; i < 9; i++) if (f[face * 9 + i] !== c) return false;
      }
      return true;
    }

    function describeMoveMalay(moveIdx) {
      const face = Math.floor(moveIdx / 3);
      const pow = moveIdx % 3;
      const cName = COLOR_DEFS[facelets[CENTER_INDICES[face]]].name;
      const dir = pow === 0 ? '90° ikut jam' : pow === 1 ? '180° (2 kali)' : '90° lawan jam';
      return `Pusing muka ${cName} (${FACE_NAMES[face]}) ${dir}`;
    }

    async function startSolveProcess(useAutoFix = false) {
      if (isAnimating || solving) return;
      stopAuto();
      hideStatusBanner();

      completeRemainingWhite();
      if (paintedMask.some(painted => !painted)) {
        showStatusBanner('Warna belum lengkap. Setiap warna mesti mempunyai 9 petak.');
        return;
      }
      const check = faceletsToCubie(facelets);
      if (!check.valid) {
        showStatusBanner('Susunan warna tidak betul.');
        return;
      }

      if (isSolved(facelets)) {

        return;
      }

      solving = true;
      setBusy(true);
      let moves;
      try {
        moves = await new Promise((resolve, reject) => {
          const worker = new Worker('solver-worker.js');
          worker.onmessage = ({data}) => { worker.terminate(); data.error ? reject(new Error(data.error)) : resolve(data.moves); };
          worker.onerror = () => { worker.terminate(); reject(new Error('Enjin tidak dapat dimuatkan. Muat semula halaman dan cuba lagi.')); };
          worker.postMessage(check.state);
        });
      } catch (error) { showStatusBanner(error.message); return; }
      finally { solving = false; setBusy(false); }
      if (!moves || moves.length === 0) {

        return;
      }

      solutionMoves = moves;
      solutionStep = 0;
      inSolveMode = true;
      document.getElementById('paintBottomBar').classList.add('hidden');
      document.getElementById('solvePlayerBar').classList.remove('hidden');
      updateSolveBarUI();
    }

    function exitSolveMode() {
      if (isAnimating || solving) return;
      stopAuto();
      inSolveMode = false;
      updateMoveArrow();
      solutionMoves = [];
      solutionStep = 0;
      document.getElementById('solvePlayerBar').classList.add('hidden');
      document.getElementById('paintBottomBar').classList.remove('hidden');
    }

    function updateSolveBarUI() {
      updateMoveArrow();
      const total = solutionMoves.length;
      const cur = solutionStep;
      const badge = document.getElementById('moveBadge');
      const counter = document.getElementById('stepCounterText');
      const instr = document.getElementById('moveInstructionText');

      document.getElementById('btnPrevStep').disabled = cur <= 0;
      document.getElementById('btnNextStep').disabled = cur >= total;
      document.getElementById('btnAutoPlay').disabled = cur >= total;

      if (cur >= total) {
        badge.textContent = '✓';
        badge.className = 'w-11 h-11 rounded-xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center shadow-inner';
        counter.textContent = `Selesai (${total}/${total})`;
        instr.textContent = '🎉 Kiub Rubik telah selesai!';
      } else {
        const m = solutionMoves[cur];
        badge.textContent = MOVE_NAMES[m];
        badge.className = 'w-11 h-11 rounded-xl bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shadow-inner';
        counter.textContent = `Langkah ${cur + 1} / ${total}`;
        instr.textContent = describeMoveMalay(m);
      }
    }

    function stepNext() {
      if (isAnimating || solutionStep >= solutionMoves.length) return;
      const m = solutionMoves[solutionStep];
      solutionStep++;
      animateLayerMove(m, 340, () => {
        updateSolveBarUI();
        if (solutionStep >= solutionMoves.length) {
          stopAuto();
        }
      });
    }

    function stepPrev() {
      if (isAnimating || solutionStep <= 0) return;
      stopAuto();
      solutionStep--;
      const inv = inverseMoveIndex(solutionMoves[solutionStep]);
      animateLayerMove(inv, 320, () => {
        updateSolveBarUI();
      });
    }

    function toggleAuto() {
      if (autoPlayTimer) {
        stopAuto();
        return;
      }
      if (solutionStep >= solutionMoves.length) return;
      document.getElementById('autoPlayIcon').textContent = '⏸';
      document.getElementById('autoPlayLabel').textContent = 'Jeda';

      function loop() {
        if (!autoPlayTimer) return;
        if (solutionStep >= solutionMoves.length) {
          stopAuto();
          return;
        }
        if (!isAnimating) stepNext();
        autoPlayTimer = setTimeout(loop, autoStepMs);
      }
      autoPlayTimer = setTimeout(loop, 30);
    }

    function stopAuto() {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        autoPlayTimer = null;
      }
      document.getElementById('autoPlayIcon').textContent = '▶';
      document.getElementById('autoPlayLabel').textContent = 'Auto';
    }

    window.addEventListener('DOMContentLoaded', () => {
      buildTopPalette();
      try { initThree(); } catch (error) { showStatusBanner('Paparan 3D tidak tersedia. Sila gunakan pelayar dengan sokongan WebGL.'); document.getElementById('btnSolve').disabled = true; return; }
      try {
        const saved = JSON.parse(sessionStorage.getItem('rubik-resume'));
        sessionStorage.removeItem('rubik-resume');
        if (saved && Array.isArray(saved.facelets) && saved.facelets.length === 54 && saved.facelets.every(c => Number.isInteger(c) && c >= 0 && c < 6)) {
          facelets = saved.facelets;
          paintedMask = Array.isArray(saved.paintedMask) && saved.paintedMask.length === 54 && saved.paintedMask.every(value => typeof value === 'boolean')
            ? saved.paintedMask : facelets.map(c => c !== 3 || facelets.filter(value => value === 3).length === 9);
          completeRemainingWhite();
          selectedColor = Number.isInteger(saved.selectedColor) && saved.selectedColor >= 0 && saved.selectedColor < 6 ? saved.selectedColor : 5;
          if (saved.inSolveMode && Array.isArray(saved.solutionMoves) && saved.solutionMoves.every(m => Number.isInteger(m) && m >= 0 && m < 18) && Number.isInteger(saved.solutionStep) && saved.solutionStep >= 0 && saved.solutionStep <= saved.solutionMoves.length) {
            inSolveMode = true; solutionMoves = saved.solutionMoves; solutionStep = saved.solutionStep;
            document.getElementById('paintBottomBar').classList.add('hidden');
            document.getElementById('solvePlayerBar').classList.remove('hidden');
            updateSolveBarUI();
          }
          buildTopPalette(); syncStickers();
        }
      } catch {}
      updateColorCount();
      document.getElementById('btnView').addEventListener('click', resetCubeOrientation);
      try {
        const speed = Number(localStorage.getItem('rubik-auto-speed'));
        if ([500,1000,1500,2000].includes(speed)) autoStepMs = speed;
        showMoveArrows = localStorage.getItem('rubik-arrows') !== 'false';
      } catch {}
      document.getElementById('autoSpeed').value = String(autoStepMs);
      document.getElementById('btnArrows').setAttribute('aria-pressed', String(showMoveArrows));
      updateMoveArrow();
      document.getElementById('autoSpeed').addEventListener('change', event => {
        const speed = Number(event.target.value);
        if ([500,1000,1500,2000].includes(speed)) autoStepMs = speed;
        try { localStorage.setItem('rubik-auto-speed', String(autoStepMs)); } catch {}
      });
      document.getElementById('btnArrows').addEventListener('click', event => {
        showMoveArrows = !showMoveArrows;
        event.currentTarget.setAttribute('aria-pressed', String(showMoveArrows));
        try { localStorage.setItem('rubik-arrows', String(showMoveArrows)); } catch {}
        updateMoveArrow();
      });

      // Reset Button: resets all stickers to blank White (just like video 00:00) so user can color from scratch!
      document.getElementById('btnReset').addEventListener('click', () => {
        if (isAnimating) return;
        exitSolveMode();
        hideStatusBanner();
        facelets = new Array(54).fill(3);
        paintedMask = new Array(54).fill(false);
        resetCubeOrientation();
        syncStickers();
        playTick(300, 0.04);
      });

      // Scramble Button: generates a valid random 3x3 scramble
      document.getElementById('btnScramble').addEventListener('click', () => {
        if (isAnimating) return;
        exitSolveMode();
        hideStatusBanner();
        let s = solvedCubie();
        for (let i = 0; i < 22; i++) {
          s = multiplyCubie(s, ALL_MOVES[Math.floor(Math.random() * 18)]);
        }
        facelets = cubieToFacelets(s);
        paintedMask = new Array(54).fill(true);
        syncStickers();
        playTick(320, 0.04);
      });

      // Solve! Button
      document.getElementById('btnSolve').addEventListener('click', () => startSolveProcess(false));
      document.getElementById('btnDismissStatus').addEventListener('click', hideStatusBanner);

      // Step-by-step Player Controls
      document.getElementById('btnNextStep').addEventListener('click', () => {
        stopAuto();
        stepNext();
      });
      document.getElementById('btnPrevStep').addEventListener('click', stepPrev);
      document.getElementById('btnAutoPlay').addEventListener('click', toggleAuto);
      document.getElementById('btnExitSolve').addEventListener('click', exitSolveMode);
    });
  
function getPaintCounts() {
  const counts = new Array(6).fill(0);
  facelets.forEach((color, idx) => { if (paintedMask[idx]) counts[color]++; });
  return counts;
}
function completeRemainingWhite() {
  const counts = getPaintCounts();
  if ([0,1,2,4,5].every(color => counts[color] === 9)) {
    facelets.forEach((color, idx) => { if (!paintedMask[idx]) { facelets[idx] = 3; paintedMask[idx] = true; } });
  }
}
function paintSticker(idx) {
  if (inSolveMode || isAnimating || solving) return;
  // A second tap clears a painted sticker, allowing corrections even when all colours are full.
  if (paintedMask[idx] && facelets[idx] === selectedColor) {
    paintedMask[idx] = false;
    facelets[idx] = 3;
  } else {
    if (getPaintCounts()[selectedColor] >= 9) {
      showStatusBanner(`${COLOR_DEFS[selectedColor].name} sudah cukup 9 petak.`);
      return;
    }
    facelets[idx] = selectedColor;
    paintedMask[idx] = true;
  }
  completeRemainingWhite();
  syncStickers();
  hideStatusBanner();
  playTick(340, 0.025);
}
function updateColorCount() {
  const counts = getPaintCounts();
  PALETTE_ORDER.forEach(color => {
    const button = document.getElementById(`colorTile_${color}`);
    if (!button) return;
    button.classList.toggle('color-tile-full', counts[color] >= 9);
    button.setAttribute('aria-label', `${COLOR_DEFS[color].name}${counts[color] >= 9 ? ', sudah cukup' : ''}`);
  });
}
function setBusy(busy) {
  for (const id of ['btnSolve','btnReset','btnScramble']) document.getElementById(id).disabled = busy;
  document.querySelectorAll('.color-tile').forEach(button => button.disabled = busy);
  document.getElementById('btnSolve').textContent = busy ? 'Sedang mencari…' : 'Selesaikan';
}

function updateMoveArrow() {
  if (moveArrow) {
    moveArrow.parent?.remove(moveArrow);
    moveArrow.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    moveArrow = null;
  }
  if (!showMoveArrows || !inSolveMode || isAnimating || solutionStep >= solutionMoves.length) return;
  const move = solutionMoves[solutionStep];
  const sticker = stickerMeshes[CENTER_INDICES[Math.floor(move / 3)]];
  if (!sticker) return;
  const direction = move % 3 === 2 ? 1 : -1;
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = 0.4 + direction * 4.7 * i / 64;
    points.push(new THREE.Vector3(1.12 * Math.cos(angle), 1.12 * Math.sin(angle), 0.045));
  }
  moveArrow = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({color:0xffdf00,depthWrite:false});
  const curve = new THREE.CatmullRomCurve3(points);
  moveArrow.add(new THREE.Mesh(new THREE.TubeGeometry(curve,64,0.035,8,false), material));
  function arrowHead(t) {
    const tangent = curve.getTangent(t).normalize();
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.12,0.28,16),material.clone());
    head.position.copy(curve.getPoint(t)).addScaledVector(tangent,0.10);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),tangent);
    moveArrow.add(head);
  }
  arrowHead(1);
  if (move % 3 === 1) arrowHead(0.5);
  sticker.add(moveArrow);
}
