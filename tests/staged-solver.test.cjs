const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context=vm.createContext({TutorialCube:require('../tutorial-moves')});
for(const file of ['engine.js','staged-solver.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
context.library=require('../tutorial-algorithms.json');
const run=code=>vm.runInContext(code,context);
function checkPlan(method){context.selectedMethod=method;return run(`(() => {
 let seed=9561;const results=[];
 for(let trial=0;trial<200;trial++){
  let state=solvedCubie();for(let j=0;j<25;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;state=multiplyCubie(state,ALL_MOVES[seed%18]);}
  const plan=solveByMethod(state,selectedMethod,library),snapshots=[];
  let current=state,cursor=0;
  for(const stage of plan.stages){if(stage.start!==cursor||stage.end<stage.start)throw Error('Bad stage range');current=methodApply(current,plan.moves.slice(cursor,stage.end));snapshots.push(current);cursor=stage.end;}
  if(cursor!==plan.moves.length||!methodFinished(current))throw Error('Unsolved plan');
  let covered=0;for(const formula of plan.formulas){if(formula.start!==covered||formula.end<=formula.start)throw Error('Formula gap');if(formula.formula!==plan.moves.slice(formula.start,formula.end).map(m=>MOVE_NAMES[m]).join(' '))throw Error('Formula mismatch');covered=formula.end;}
  if(covered!==plan.moves.length)throw Error('Uncovered moves');
  const cross=s=>[4,5,6,7].every(i=>s.ep[i]===i&&s.eo[i]===0);
  const layer=s=>cross(s)&&[4,5,6,7].every(i=>s.cp[i]===i&&s.co[i]===0);
  if(selectedMethod==='beginner'){
    if(!cross(snapshots[0])||!layer(snapshots[1])||!methodF2L(snapshots[2])||!snapshots[3].eo.every(v=>v===0)||!snapshots[4].ep.every((v,i)=>v===i)||!snapshots[5].cp.every((v,i)=>v===i))throw Error('Wrong LBL stage');
  }
  if(selectedMethod==='cfop'||selectedMethod==='cfop2'){
    if(!cross(snapshots[0])||!methodF2L(snapshots[1]))throw Error('Wrong CFOP base');
    if(selectedMethod==='cfop'&&!methodTopOriented(snapshots[2]))throw Error('Bad OLL');
    if(selectedMethod==='cfop2'&&(!snapshots[2].eo.every(v=>v===0)||!methodTopOriented(snapshots[3])||!snapshots[4].cp.every((v,i)=>v===i)))throw Error('Wrong 2-look stages');
  }
  if(selectedMethod==='zz'){
    if(!snapshots[0].eo.every(v=>v===0)||![5,7].every(i=>snapshots[1].ep[i]===i)||!methodF2L(snapshots[2])||!methodTopOriented(snapshots[3]))throw Error('Wrong ZZ stage');
  }
  results.push(plan.moves.length);
 }
 return results.length;
})()`);}
for(const method of ['auto','beginner','cfop2','cfop','zz'])test(`${method}: 200 legal scrambles solve with truthful stage goals and exact displayed formulas`,()=>assert.equal(checkPlan(method),200));
test('OLL/PLL wide moves compile correctly into fixed-frame face notation',()=>{
 assert.equal(run(`(() => {
 const rotations=[[]],seen=new Set(['012345']);
 for(let i=0;i<rotations.length;i++)for(const token of ['x','y','z']){const path=[...rotations[i],token],state=TutorialCube.apply(TutorialCube.solved(),path),key=CENTER_INDICES.map(i=>state[i]).join('');if(!seen.has(key)){seen.add(key);rotations.push(path);}}
 return library.every(algorithm=>{const moves=methodCompile(algorithm.alg),raw=TutorialCube.apply(TutorialCube.solved(),algorithm.alg);const normalized=rotations.map(rotation=>TutorialCube.apply(raw,rotation)).find(state=>CENTER_INDICES.every((i,face)=>state[i]===face));const compiled=cubieToFacelets(methodApply(solvedCubie(),moves));return normalized.every((v,i)=>v===compiled[i]);});
 })()`),true);
});
test('solved states and already completed stages require no artificial moves',()=>{
 assert.equal(run(`Object.keys(METHOD_NAMES).every(method=>solveByMethod(solvedCubie(),method,library).moves.length===0)`),true);
 assert.throws(()=>run(`solveByMethod(solvedCubie(),'roux',library)`),/Teknik tidak dikenali/);
});
