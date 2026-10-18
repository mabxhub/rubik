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

test('41 F2L cases cover all 149 unsolved pair configurations up to AUF and preserve the cross and other slots',()=>{
 const entries=algorithms.filter(a=>a.group==='F2L');assert.equal(entries.length,41);
 const key=state=>{engine.faceletInput=state;return Array.from(vm.runInContext(`(()=>{const s=faceletsToCubie(faceletInput).state,c=s.cp.indexOf(4),e=s.ep.indexOf(8);return [c,s.co[c],e,s.eo[e]]})()`,engine)).join('/');};
 const covered=new Set();const representatives=new Set();
 for(const a of entries){const state=C.caseFor(a.alg);const orbit=['','U','U2',"U'"].map(u=>key(C.apply(state,u))).sort();assert.ok(!representatives.has(orbit[0]),'duplicate F2L case '+a.name);representatives.add(orbit[0]);orbit.forEach(k=>covered.add(k));
 for(let i=0;i<54;i++){const {pos}=C.geometry(i);const cross=pos[1]===-1&&pos.filter(Boolean).length===2;const otherPairs=pos[1]<=0&&!(pos[0]===1&&pos[2]===1);if(cross||otherPairs)assert.equal(state[i],Math.floor(i/9),`${a.name} changes preserved sticker ${i}`);}
 }
 assert.equal(covered.size,149);assert.ok(!covered.has('4/0/8/0'));covered.add('4/0/8/0');
 for(const c of [0,1,2,3,4])for(let co=0;co<3;co++)for(const e of [0,1,2,3,8])for(let eo=0;eo<2;eo++)assert.ok(covered.has([c,co,e,eo].join('/')),'missing configuration');
});
test('case notes and AUF variants agree with the diagrams and the playback for every formula',()=>{
 const N=require('../tutorial-notes');for(const a of algorithms)for(let turn=0;turn<4;turn++){
 const p=N.profile(a,turn);assert.deepEqual(p.state,C.apply(C.caseFor(a.alg),['','U','U2',"U'"][turn]));assert.deepEqual(C.apply(p.state,p.algorithm.alg),C.solved());assert.ok(p.sections.length>=3);for(const [heading,text] of p.sections){assert.ok(heading&&text);assert.ok(!/undefined|NaN/.test(text),a.name);}
 if(a.group==='F2L')assert.ok(p.sections.find(([h])=>h==='Kenali kes')[1].includes('Bucu sasaran berada di'));
 }
 for(const m of content.methods)for(const lesson of m.steps)for(const situation of lesson.situations||[]){assert.ok(situation.when);assert.ok(situation.action.length>40);}
 assert.ok(content.methods.find(m=>m.id==='beginner').steps.every(s=>s.situations.length>=4));
});
