const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
vm.runInThisContext(fs.readFileSync(require('node:path').join(__dirname,'../engine.js'),'utf8'));
let seed=42;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;}
test('all 18 visual moves agree with solver moves and invert correctly',()=>{
 for(let m=0;m<18;m++){
 const f=cubieToFacelets(solvedCubie());
 assert.deepEqual(applyMoveToFacelets(f,m),cubieToFacelets(ALL_MOVES[m]));
 assert.deepEqual(applyMoveToFacelets(applyMoveToFacelets(f,m),inverseMoveIndex(m)),f);
 }
});
test('100 seeded scrambles solve, including custom centre colour schemes',()=>{
 for(let n=0;n<100;n++){
 let state=solvedCubie();for(let j=0;j<25;j++)state=multiplyCubie(state,ALL_MOVES[Math.floor(random()*18)]);
 let f=cubieToFacelets(state);const map=[5,3,4,2,0,1];if(n%2)f=f.map(c=>map[c]);
 const check=faceletsToCubie(f);assert.equal(check.valid,true);assert.deepEqual(check.state,state);
 const moves=solveCubeState(check.state);for(const m of moves)f=applyMoveToFacelets(f,m);
 assert.ok(f.every((c,i)=>c===f[Math.floor(i/9)*9+4]));
 }
});
test('reject blank cube, flipped edge, twisted corner and impossible parity',()=>{
 assert.equal(faceletsToCubie(Array(54).fill(3)).valid,false);
 let s=solvedCubie();s.eo[0]=1;assert.equal(faceletsToCubie(cubieToFacelets(s)).valid,false);
 s=solvedCubie();s.co[0]=1;assert.equal(faceletsToCubie(cubieToFacelets(s)).valid,false);
 s=solvedCubie();[s.ep[0],s.ep[1]]=[s.ep[1],s.ep[0]];assert.equal(faceletsToCubie(cubieToFacelets(s)).valid,false);
});
