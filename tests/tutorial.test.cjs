const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const C=require('../tutorial-moves');
const content=require('../tutorial-methods.json');
const algorithms=[...content.extraAlgorithms,...require('../tutorial-algorithms.json')];
const engine=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../engine.js'),'utf8'),engine);
test('tutorial face turns agree with the production solver',()=>{
 for(const face of C.faces)for(const suffix of ['','2',"'"]){const token=face+suffix;const expected=vm.runInContext(`applyMoveToFacelets(cubieToFacelets(solvedCubie()),MOVE_NAMES.indexOf(${JSON.stringify(token)}))`,engine);assert.deepEqual(C.apply(C.solved(),token),Array.from(expected));}
});
test('wide, slice and whole-cube notation have correct geometry',()=>{
 const s=Array.from({length:54},(_,i)=>i);
 for(const base of ['U','R','F','D','L','B','M','E','S','r','l','u','d','f','b','x','y','z']){
 assert.deepEqual(C.apply(s,`${base} ${base} ${base} ${base}`),s);
 assert.deepEqual(C.apply(C.apply(s,base),C.inverse(base)),s);
 assert.equal(new Set(C.permutation(base)).size,54);
 }
 assert.deepEqual(C.apply(s,'r'),C.apply(s,"R M'"));
 assert.deepEqual(C.apply(s,'x'),C.apply(s,"R M' L'"));
 assert.deepEqual(C.apply(s,'y'),C.apply(s,"U E' D'"));
 assert.deepEqual(C.apply(s,'z'),C.apply(s,"F S B'"));
 assert.deepEqual(C.parse('(R U R′ U′)6'),Array(6).fill(['R','U',"R'","U'"]).flat());
 assert.throws(()=>C.parse('(R U'));assert.throws(()=>C.parse('R bad'));assert.deepEqual(C.parse('Rw2 U2\''),['r2','U2']);
});
test('complete OLL, PLL and CMLL libraries have unique IDs and every case solves',()=>{
 const ids=new Set();for(const a of algorithms){assert.ok(!ids.has(a.id),a.id);ids.add(a.id);const tokens=C.parse(a.alg);assert.ok(tokens.length>0);assert.deepEqual(C.apply(C.caseFor(tokens),tokens),C.solved(),a.name);}
 assert.equal(algorithms.filter(a=>a.group==='OLL').length,57);
 assert.equal(algorithms.filter(a=>a.group==='PLL').length,21);
 assert.equal(algorithms.filter(a=>a.group==='CMLL').length,42);
});
test('last-layer libraries preserve the required solved pieces',()=>{
 const same=(s,i)=>s[i]===s[Math.floor(i/9)*9+4];
 for(const a of algorithms.filter(a=>['OLL','PLL','CMLL'].includes(a.group))){const s=C.caseFor(a.alg);for(let i=0;i<54;i++){const face=Math.floor(i/9);const {pos}=C.geometry(i);if(a.group==='CMLL'){if(Math.abs(pos[0])===1&&pos[1]<=0)assert.ok(same(s,i),`${a.name} breaks block`);}else if(face!==0&&(face===3||i%9>=3))assert.ok(same(s,i),`${a.name} breaks F2L`);}if(a.group==='PLL')assert.ok(s.slice(0,9).every(v=>v===s[4]),a.name);}
});
test('every lesson has an illustration, readable text, valid formula references and sources',()=>{
 const ids=new Set(algorithms.map(a=>a.id));for(const m of content.methods){assert.ok(m.sources.length);assert.ok(m.steps.length>1);for(const l of m.steps){assert.ok(l.diagram);assert.ok(l.body.length);for(const id of l.algs||[])assert.ok(ids.has(id),id);}}
});
