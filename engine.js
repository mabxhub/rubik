
    // =========================================================================
    // 1. COLOR DEFINITIONS (Exact Order & Vibrant Flat Colors from Video)
    // =========================================================================
    // Internal Solver Canonical IDs: 0:U(Yellow), 1:R(Red), 2:F(Blue), 3:D(White), 4:L(Orange), 5:B(Green)
    const COLOR_DEFS = {
      0: { id: 0, name: 'Kuning', hex: '#FFD500', threeHex: 0xFFD500 },
      1: { id: 1, name: 'Merah',  hex: '#C41E24', threeHex: 0xC41E24 },
      2: { id: 2, name: 'Biru',   hex: '#1D63B8', threeHex: 0x1D63B8 },
      3: { id: 3, name: 'Putih',  hex: '#FFFFFF', threeHex: 0xFFFFFF },
      4: { id: 4, name: 'Jingga', hex: '#FF6B00', threeHex: 0xFF6B00 },
      5: { id: 5, name: 'Hijau',  hex: '#159E2A', threeHex: 0x159E2A }
    };

    // Display order in top bar matching video: Red, Blue, Yellow, Green, White, Orange
    const PALETTE_ORDER = [1, 2, 0, 5, 3, 4];
    const CENTER_INDICES = [4, 13, 22, 31, 40, 49];

    // =========================================================================
    // 2. 3x3 CUBIE & 4-PHASE THISTLETHWAITE SOLVER ENGINE
    // =========================================================================
    const CORNER_FACELETS = [
      [8, 9, 20],   [6, 18, 38],  [0, 36, 47],  [2, 45, 11],
      [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]
    ];
    const CORNER_COLORS = [
      [0, 1, 2], [0, 2, 4], [0, 4, 5], [0, 5, 1],
      [3, 2, 1], [3, 4, 2], [3, 5, 4], [3, 1, 5]
    ];
    const EDGE_FACELETS = [
      [5, 10],  [7, 19],  [3, 37],  [1, 46],
      [32, 16], [28, 25], [30, 43], [34, 52],
      [23, 12], [21, 41], [50, 39], [48, 14]
    ];
    const EDGE_COLORS = [
      [0, 1], [0, 2], [0, 4], [0, 5],
      [3, 1], [3, 2], [3, 4], [3, 5],
      [2, 1], [2, 4], [5, 4], [5, 1]
    ];

    const BASIC_MOVES = [
      { cp: [3,0,1,2,4,5,6,7], co: [0,0,0,0,0,0,0,0], ep: [3,0,1,2,4,5,6,7,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] }, // U
      { cp: [4,1,2,0,7,5,6,3], co: [2,0,0,1,1,0,0,2], ep: [8,1,2,3,11,5,6,7,4,9,10,0], eo: [0,0,0,0,0,0,0,0,0,0,0,0] }, // R
      { cp: [1,5,2,3,0,4,6,7], co: [1,2,0,0,2,1,0,0], ep: [0,9,2,3,4,8,6,7,1,5,10,11], eo: [0,1,0,0,0,1,0,0,1,1,0,0] }, // F
      { cp: [0,1,2,3,5,6,7,4], co: [0,0,0,0,0,0,0,0], ep: [0,1,2,3,5,6,7,4,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] }, // D
      { cp: [0,2,6,3,4,1,5,7], co: [0,1,2,0,0,2,1,0], ep: [0,1,10,3,4,5,9,7,8,2,6,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] }, // L
      { cp: [0,1,3,7,4,5,2,6], co: [0,0,1,2,0,0,2,1], ep: [0,1,2,11,4,5,6,10,8,9,3,7], eo: [0,0,0,1,0,0,0,1,0,0,1,1] }  // B
    ];

    function multiplyCubie(a, b) {
      const cp = new Array(8), co = new Array(8), ep = new Array(12), eo = new Array(12);
      for (let i = 0; i < 8; i++) { cp[i] = a.cp[b.cp[i]]; co[i] = (a.co[b.cp[i]] + b.co[i]) % 3; }
      for (let i = 0; i < 12; i++) { ep[i] = a.ep[b.ep[i]]; eo[i] = (a.eo[b.ep[i]] + b.eo[i]) % 2; }
      return { cp, co, ep, eo };
    }

    function solvedCubie() {
      return { cp: [0,1,2,3,4,5,6,7], co: [0,0,0,0,0,0,0,0], ep: [0,1,2,3,4,5,6,7,8,9,10,11], eo: [0,0,0,0,0,0,0,0,0,0,0,0] };
    }

    const ALL_MOVES = [];
    const MOVE_NAMES = [];
    const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
    for (let f = 0; f < 6; f++) {
      let cur = solvedCubie();
      for (let p = 0; p < 3; p++) {
        cur = multiplyCubie(cur, BASIC_MOVES[f]);
        ALL_MOVES.push(cur);
        MOVE_NAMES.push(FACE_NAMES[f] + (p === 0 ? '' : p === 1 ? '2' : "'"));
      }
    }

    function inverseMoveIndex(m) {
      const f = Math.floor(m / 3);
      const p = m % 3;
      return f * 3 + (2 - p);
    }

    function cubieToFacelets(state) {
      const f = new Array(54);
      for (let c = 0; c < 6; c++) f[c * 9 + 4] = c;
      for (let i = 0; i < 8; i++) {
        const j = state.cp[i], ori = state.co[i];
        for (let k = 0; k < 3; k++) f[CORNER_FACELETS[i][(k + ori) % 3]] = CORNER_COLORS[j][k];
      }
      for (let i = 0; i < 12; i++) {
        const j = state.ep[i], ori = state.eo[i];
        for (let k = 0; k < 2; k++) f[EDGE_FACELETS[i][(k + ori) % 2]] = EDGE_COLORS[j][k];
      }
      return f;
    }

    function getFacelet3D(idx) {
      const face = Math.floor(idx / 9), rem = idx % 9, row = Math.floor(rem / 3), col = rem % 3;
      if (face === 0) return { pos: [col - 1, 1, row - 1], normal: [0, 1, 0] };
      if (face === 1) return { pos: [1, 1 - row, 1 - col], normal: [1, 0, 0] };
      if (face === 2) return { pos: [col - 1, 1 - row, 1], normal: [0, 0, 1] };
      if (face === 3) return { pos: [col - 1, -1, 1 - row], normal: [0, -1, 0] };
      if (face === 4) return { pos: [-1, 1 - row, col - 1], normal: [-1, 0, 0] };
      return { pos: [1 - col, 1 - row, -1], normal: [0, 0, -1] };
    }

    const FACE_3D_SPEC = [
      { name: 'U', axis: 'y', layer: 1,  cwSign: -1 },
      { name: 'R', axis: 'x', layer: 1,  cwSign: -1 },
      { name: 'F', axis: 'z', layer: 1,  cwSign: -1 },
      { name: 'D', axis: 'y', layer: -1, cwSign: 1 },
      { name: 'L', axis: 'x', layer: -1, cwSign: 1 },
      { name: 'B', axis: 'z', layer: -1, cwSign: 1 }
    ];

    const MOVE_FACELET_PERM = [];
    {
      function rotateVec90([x, y, z], axis, sign) {
        if (axis === 'x') return sign === 1 ? [x, -z, y] : [x, z, -y];
        if (axis === 'y') return sign === 1 ? [z, y, -x] : [-z, y, x];
        return sign === 1 ? [-y, x, z] : [y, -x, z];
      }
      for (let f = 0; f < 6; f++) {
        const spec = FACE_3D_SPEC[f];
        const axisIdx = spec.axis === 'x' ? 0 : spec.axis === 'y' ? 1 : 2;
        for (let p = 0; p < 3; p++) {
          const turns = p + 1;
          const perm = new Int8Array(54);
          for (let i = 0; i < 54; i++) {
            let { pos, normal } = getFacelet3D(i);
            if (pos[axisIdx] === spec.layer) {
              for (let t = 0; t < turns; t++) {
                pos = rotateVec90(pos, spec.axis, spec.cwSign);
                normal = rotateVec90(normal, spec.axis, spec.cwSign);
              }
            }
            for (let j = 0; j < 54; j++) {
              const target = getFacelet3D(j);
              if (
                target.pos[0] === pos[0] && target.pos[1] === pos[1] && target.pos[2] === pos[2] &&
                target.normal[0] === normal[0] && target.normal[1] === normal[1] && target.normal[2] === normal[2]
              ) {
                perm[j] = i;
                break;
              }
            }
          }
          MOVE_FACELET_PERM.push(perm);
        }
      }
    }

    function applyMoveToFacelets(arr, moveIdx) {
      const perm = MOVE_FACELET_PERM[moveIdx];
      const next = new Array(54);
      for (let i = 0; i < 54; i++) next[i] = arr[perm[i]];
      return next;
    }

    function permParity(arr) {
      let inv = 0;
      for (let i = 0; i < arr.length; i++)
        for (let j = i + 1; j < arr.length; j++)
          if (arr[i] > arr[j]) inv++;
      return inv % 2;
    }

    function faceletsToCubie(f) {
      const centerColors = CENTER_INDICES.map(idx => f[idx]);
      const uniqueCenters = new Set(centerColors);
      if (uniqueCenters.size !== 6) {
        return { valid: false, canAutoFix: false, error: 'Sila warnakan 6 petak tengah dengan 6 warna berbeza.' };
      }
      const counts = [0, 0, 0, 0, 0, 0];
      for (const c of f) if (c >= 0 && c < 6) counts[c]++;

      // If still mostly white/unpainted
      if (counts[3] > 25) {
        return { valid: false, canAutoFix: false, error: 'Sila warnakan kesemua 6 muka kiub mengikut Rubik anda dahulu (atau klik ikon Acak).' };
      }

      const wrong = [];
      for (let c = 0; c < 6; c++) {
        if (counts[c] !== 9) wrong.push(`${COLOR_DEFS[c].name}: ${counts[c]}/9`);
      }
      if (wrong.length > 0) {
        return { valid: false, canAutoFix: true, error: `Kiraan warna belum tepat 9 (${wrong.join(', ')}).` };
      }

      const colorMap = {};
      for (let i = 0; i < 6; i++) colorMap[centerColors[i]] = i;
      const norm = f.map(c => colorMap[c]);

      const cp = new Array(8).fill(-1), co = new Array(8).fill(0), usedCorners = new Array(8).fill(false);
      for (let i = 0; i < 8; i++) {
        const c0 = norm[CORNER_FACELETS[i][0]], c1 = norm[CORNER_FACELETS[i][1]], c2 = norm[CORNER_FACELETS[i][2]];
        let found = false;
        for (let j = 0; j < 8; j++) {
          const target = CORNER_COLORS[j];
          for (let ori = 0; ori < 3; ori++) {
            if (c0 === target[(3 - ori) % 3] && c1 === target[(4 - ori) % 3] && c2 === target[(5 - ori) % 3]) {
              if (usedCorners[j]) return { valid: false, canAutoFix: true, error: 'Terdapat bucu (corner) berwarna sama lebih daripada satu.' };
              usedCorners[j] = true; cp[i] = j; co[i] = ori; found = true; break;
            }
          }
          if (found) break;
        }
        if (!found) return { valid: false, canAutoFix: true, error: `Semak bucu ${CORNER_FACELETS[i].map(idx => FACE_NAMES[Math.floor(idx / 9)]).join('–')}: gabungan warna tidak sepadan dengan petak tengah.` };
      }

      const ep = new Array(12).fill(-1), eo = new Array(12).fill(0), usedEdges = new Array(12).fill(false);
      for (let i = 0; i < 12; i++) {
        const e0 = norm[EDGE_FACELETS[i][0]], e1 = norm[EDGE_FACELETS[i][1]];
        let found = false;
        for (let j = 0; j < 12; j++) {
          const target = EDGE_COLORS[j];
          if (e0 === target[0] && e1 === target[1]) {
            if (usedEdges[j]) return { valid: false, canAutoFix: true, error: 'Terdapat tepi (edge) berwarna sama lebih daripada satu.' };
            usedEdges[j] = true; ep[i] = j; eo[i] = 0; found = true; break;
          } else if (e0 === target[1] && e1 === target[0]) {
            if (usedEdges[j]) return { valid: false, canAutoFix: true, error: 'Terdapat tepi (edge) berwarna sama lebih daripada satu.' };
            usedEdges[j] = true; ep[i] = j; eo[i] = 1; found = true; break;
          }
        }
        if (!found) return { valid: false, canAutoFix: true, error: `Semak tepi ${EDGE_FACELETS[i].map(idx => FACE_NAMES[Math.floor(idx / 9)]).join('–')}: gabungan warna tidak sepadan dengan petak tengah.` };
      }

      if (co.reduce((a, b) => a + b, 0) % 3 !== 0) {
        return { valid: false, canAutoFix: true, error: 'Satu bucu terpusing secara tidak sah — semak warna bucu.' };
      }
      if (eo.reduce((a, b) => a + b, 0) % 2 !== 0) {
        return { valid: false, canAutoFix: true, error: 'Satu tepi terbalik secara tidak sah — semak warna tepi.' };
      }
      if (permParity(cp) !== permParity(ep)) {
        return { valid: false, canAutoFix: true, error: 'Pariti kedudukan petak tidak sah.' };
      }

      return { valid: true, state: { cp, co, ep, eo }, centerColors };
    }

    // --- Fast Pruning & Coordinate Tables ---
    const PHASE_MOVES = [
      [0,1,2, 3,4,5, 6,7,8, 9,10,11, 12,13,14, 15,16,17],
      [0,1,2, 3,4,5, 7,     9,10,11, 12,13,14, 16],
      [0,1,2, 4,     7,     9,10,11, 13,       16],
      [1,     4,     7,     10,      13,       16]
    ];
    const C_NK = Array.from({ length: 13 }, () => new Array(5).fill(0));
    for (let n = 0; n <= 12; n++) {
      C_NK[n][0] = 1;
      for (let k = 1; k <= 4 && k <= n; k++) C_NK[n][k] = C_NK[n - 1][k - 1] + C_NK[n - 1][k];
    }
    const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];

    function getEOIndex(s) { let idx = 0; for (let i = 0; i < 11; i++) idx = (idx << 1) | s.eo[i]; return idx; }
    function getCOIndex(s) { let idx = 0; for (let i = 0; i < 7; i++) idx = idx * 3 + s.co[i]; return idx; }
    function getESliceIndex(s) {
      let idx = 0, k = 4;
      for (let i = 11; i >= 0; i--) if (s.ep[i] >= 8) { idx += C_NK[i][k]; k--; }
      return idx;
    }
    function getPerm8Index(arr) {
      let idx = 0;
      for (let i = 0; i < 7; i++) {
        let smaller = 0;
        for (let j = i + 1; j < 8; j++) if (arr[j] < arr[i]) smaller++;
        idx += smaller * FACT[7 - i];
      }
      return idx;
    }
    function getPerm4Index(arr) {
      let idx = 0;
      for (let i = 0; i < 3; i++) {
        let smaller = 0;
        for (let j = i + 1; j < 4; j++) if (arr[j] < arr[i]) smaller++;
        idx += smaller * FACT[3 - i];
      }
      return idx;
    }
    function getMSSliceIndex(s) {
      let idx = 0, k = 4;
      for (let i = 7; i >= 0; i--) if ((s.ep[i] & 1) === 1) { idx += C_NK[i][k]; k--; }
      return idx;
    }
    function getEP4FullIndex(s) {
      const sArr = [s.ep[0], s.ep[2], s.ep[4], s.ep[6]];
      const mArr = [s.ep[1], s.ep[3], s.ep[5], s.ep[7]];
      const eArr = [s.ep[8], s.ep[9], s.ep[10], s.ep[11]];
      return (getPerm4Index(sArr) * 24 + getPerm4Index(mArr)) * 24 + getPerm4Index(eArr);
    }

    let solverReady = false;
    const moveEO = new Int16Array(2048 * 18), distEO = new Int8Array(2048).fill(-1);
    const moveCO = new Int16Array(2187 * 14), distCO = new Int8Array(2187).fill(-1);
    const moveESlice = new Int16Array(495 * 14), distESlice = new Int8Array(495).fill(-1);
    const moveCP3 = new Int32Array(40320 * 10), distCP3 = new Int8Array(40320).fill(-1);
    const cp4Map = new Int16Array(40320).fill(-1), distCP4Compact = new Int8Array(96).fill(-1), moveCP4 = new Int16Array(96 * 6);
    const moveMSSlice = new Int16Array(70 * 10), distMSSlice = new Int8Array(70).fill(-1);
    const distEP4Full = new Int8Array(13824).fill(-1), moveEP4Full = new Int16Array(13824 * 6);

    function initSolverTables() {
      if (solverReady) return;
      {
        const q = [solvedCubie()]; distEO[0] = 0;
        for (let h = 0; h < q.length; h++) {
          const cur = q[h], u = getEOIndex(cur), d = distEO[u];
          for (let m = 0; m < 18; m++) {
            const nxt = multiplyCubie(cur, ALL_MOVES[m]), v = getEOIndex(nxt);
            moveEO[u * 18 + m] = v;
            if (distEO[v] === -1) { distEO[v] = d + 1; q.push(nxt); }
          }
        }
      }
      {
        const q = [solvedCubie()]; distCO[0] = 0;
        for (let h = 0; h < q.length; h++) {
          const cur = q[h], u = getCOIndex(cur), d = distCO[u];
          for (let mi = 0; mi < 14; mi++) {
            const m = PHASE_MOVES[1][mi], nxt = multiplyCubie(cur, ALL_MOVES[m]), v = getCOIndex(nxt);
            moveCO[u * 14 + mi] = v;
            if (distCO[v] === -1) { distCO[v] = d + 1; q.push(nxt); }
          }
        }
      }
      {
        const q = [solvedCubie()], seen = new Uint8Array(495), u0 = getESliceIndex(q[0]);
        seen[u0] = 1;
        for (let h = 0; h < q.length; h++) {
          const cur = q[h], u = getESliceIndex(cur);
          for (let m = 0; m < 18; m++) {
            const nxt = multiplyCubie(cur, ALL_MOVES[m]), v = getESliceIndex(nxt);
            if (!seen[v]) { seen[v] = 1; q.push(nxt); }
          }
          for (let mi = 0; mi < 14; mi++) {
            moveESlice[u * 14 + mi] = getESliceIndex(multiplyCubie(cur, ALL_MOVES[PHASE_MOVES[1][mi]]));
          }
        }
        distESlice[u0] = 0;
        const q2 = [u0];
        for (let h = 0; h < q2.length; h++) {
          const u = q2[h], d = distESlice[u];
          for (let mi = 0; mi < 14; mi++) {
            const v = moveESlice[u * 14 + mi];
            if (distESlice[v] === -1) { distESlice[v] = d + 1; q2.push(v); }
          }
        }
      }
      function multCP(a, b) { return [a[b[0]], a[b[1]], a[b[2]], a[b[3]], a[b[4]], a[b[5]], a[b[6]], a[b[7]]]; }
      {
        const cp0 = [0,1,2,3,4,5,6,7];
        distCP3[0] = 0; cp4Map[0] = 0; distCP4Compact[0] = 0;
        const q4 = [cp0];
        for (let h = 0; h < q4.length; h++) {
          const cur = q4[h], d = distCP4Compact[h];
          for (let mi = 0; mi < 6; mi++) {
            const m = PHASE_MOVES[3][mi], nxt = multCP(cur, ALL_MOVES[m].cp), v = getPerm8Index(nxt);
            if (cp4Map[v] === -1) {
              const id4 = q4.length;
              cp4Map[v] = id4; distCP4Compact[id4] = d + 1; distCP3[v] = 0; q4.push(nxt);
            }
            moveCP4[h * 6 + mi] = cp4Map[v];
          }
        }
        const q3 = [...q4];
        for (let h = 0; h < q3.length; h++) {
          const cur = q3[h], u = getPerm8Index(cur), d = distCP3[u];
          for (let mi = 0; mi < 10; mi++) {
            const m = PHASE_MOVES[2][mi], nxt = multCP(cur, ALL_MOVES[m].cp), v = getPerm8Index(nxt);
            moveCP3[u * 10 + mi] = v;
            if (distCP3[v] === -1) { distCP3[v] = d + 1; q3.push(nxt); }
          }
        }
      }
      {
        const q = [solvedCubie()], u0 = getMSSliceIndex(q[0]); distMSSlice[u0] = 0;
        for (let h = 0; h < q.length; h++) {
          const cur = q[h], u = getMSSliceIndex(cur), d = distMSSlice[u];
          for (let mi = 0; mi < 10; mi++) {
            const nxt = multiplyCubie(cur, ALL_MOVES[PHASE_MOVES[2][mi]]), v = getMSSliceIndex(nxt);
            moveMSSlice[u * 10 + mi] = v;
            if (distMSSlice[v] === -1) { distMSSlice[v] = d + 1; q.push(nxt); }
          }
        }
      }
      {
        const q = [solvedCubie()], u0 = getEP4FullIndex(q[0]); distEP4Full[u0] = 0;
        for (let h = 0; h < q.length; h++) {
          const cur = q[h], u = getEP4FullIndex(cur), d = distEP4Full[u];
          for (let mi = 0; mi < 6; mi++) {
            const nxt = multiplyCubie(cur, ALL_MOVES[PHASE_MOVES[3][mi]]), v = getEP4FullIndex(nxt);
            moveEP4Full[u * 6 + mi] = v;
            if (distEP4Full[v] === -1) { distEP4Full[v] = d + 1; q.push(nxt); }
          }
        }
      }
      solverReady = true;
    }

    function simplifyMoves(moveIndices) {
      const stack = [];
      for (const m of moveIndices) {
        const face = Math.floor(m / 3), pow = (m % 3) + 1;
        if (stack.length > 0 && stack[stack.length - 1].face === face) {
          stack[stack.length - 1].pow = (stack[stack.length - 1].pow + pow) % 4;
          if (stack[stack.length - 1].pow === 0) stack.pop();
        } else if (stack.length >= 2 && stack[stack.length - 2].face === face && Math.abs(stack[stack.length - 1].face - face) === 3) {
          stack[stack.length - 2].pow = (stack[stack.length - 2].pow + pow) % 4;
          if (stack[stack.length - 2].pow === 0) stack.splice(stack.length - 2, 1);
        } else {
          stack.push({ face, pow });
        }
      }
      return stack.map(x => x.face * 3 + (x.pow - 1));
    }

    function solveCubeState(startState, onPhase = null) {
      initSolverTables();
      let cur = startState;
      const allMoves = [];
      {
        let u = getEOIndex(cur);
        while (distEO[u] > 0) {
          const d = distEO[u];
          for (let m = 0; m < 18; m++) {
            const v = moveEO[u * 18 + m];
            if (distEO[v] === d - 1) { allMoves.push(m); cur = multiplyCubie(cur, ALL_MOVES[m]); u = v; break; }
          }
        }
      }
      if (onPhase) onPhase(0, allMoves);
      {
        const startCO = getCOIndex(cur), startES = getESliceIndex(cur), allowed = PHASE_MOVES[1], path = [];
        function dfs1(co, es, g, lastFace, bound) {
          const h = Math.max(distCO[co], distESlice[es]);
          if (h === 0) return true;
          if (g + h > bound) return false;
          for (let mi = 0; mi < 14; mi++) {
            const m = allowed[mi], face = (m / 3) | 0;
            if (face === lastFace || (lastFace !== -1 && face - lastFace === 3)) continue;
            path.push(m);
            if (dfs1(moveCO[co * 14 + mi], moveESlice[es * 14 + mi], g + 1, face, bound)) return true;
            path.pop();
          }
          return false;
        }
        for (let bound = Math.max(distCO[startCO], distESlice[startES]); bound <= 12; bound++) {
          if (dfs1(startCO, startES, 0, -1, bound)) break;
        }
        for (const m of path) { cur = multiplyCubie(cur, ALL_MOVES[m]); allMoves.push(m); }
        if (onPhase) onPhase(1, allMoves);
      }
      {
        const startCP = getPerm8Index(cur.cp), startMS = getMSSliceIndex(cur), allowed = PHASE_MOVES[2], path = [];
        function dfs2(cp, ms, g, lastFace, bound) {
          const h = Math.max(distCP3[cp], distMSSlice[ms]);
          if (h === 0) return true;
          if (g + h > bound) return false;
          for (let mi = 0; mi < 10; mi++) {
            const m = allowed[mi], face = (m / 3) | 0;
            if (face === lastFace || (lastFace !== -1 && face - lastFace === 3)) continue;
            path.push(m);
            if (dfs2(moveCP3[cp * 10 + mi], moveMSSlice[ms * 10 + mi], g + 1, face, bound)) return true;
            path.pop();
          }
          return false;
        }
        for (let bound = Math.max(distCP3[startCP], distMSSlice[startMS]); bound <= 15; bound++) {
          if (dfs2(startCP, startMS, 0, -1, bound)) break;
        }
        for (const m of path) { cur = multiplyCubie(cur, ALL_MOVES[m]); allMoves.push(m); }
        if (onPhase) onPhase(2, allMoves);
      }
      {
        const startCP = cp4Map[getPerm8Index(cur.cp)], startEP = getEP4FullIndex(cur), allowed = PHASE_MOVES[3], path = [];
        function dfs3(cp4, ep4, g, lastFace, bound) {
          const h = Math.max(distCP4Compact[cp4], distEP4Full[ep4]);
          if (h === 0) return true;
          if (g + h > bound) return false;
          for (let mi = 0; mi < 6; mi++) {
            const m = allowed[mi], face = (m / 3) | 0;
            if (face === lastFace || (lastFace !== -1 && face - lastFace === 3)) continue;
            path.push(m);
            if (dfs3(moveCP4[cp4 * 6 + mi], moveEP4Full[ep4 * 6 + mi], g + 1, face, bound)) return true;
            path.pop();
          }
          return false;
        }
        for (let bound = Math.max(distCP4Compact[startCP], distEP4Full[startEP]); bound <= 15; bound++) {
          if (dfs3(startCP, startEP, 0, -1, bound)) break;
        }
        for (const m of path) { cur = multiplyCubie(cur, ALL_MOVES[m]); allMoves.push(m); }
        if (onPhase) onPhase(3, allMoves);
      }
      return onPhase ? allMoves : simplifyMoves(allMoves);
    }

