const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context=vm.createContext({TutorialCube:require('../tutorial-moves')});for(const name of ['engine.js','staged-solver.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
context.library=require('../tutorial-algorithms.json');const run=code=>vm.runInContext(code,context);
test('target follows physical corner and edge; destination stays fixed',()=>{
 assert.equal(run(`(() => {let state=methodApply(solvedCubie(),methodParse("R U R'"));const target=makeFormulaTarget(state,[['c',4],['e',8]],'solved');const before=formulaTargetView(state,target);state=methodApply(state,methodParse("U R"));const after=formulaTargetView(state,target);return target.pieces.length===2&&after.current.length===5&&JSON.stringify(before.current)!==JSON.stringify(after.current)&&JSON.stringify(before.destinations)===JSON.stringify(after.destinations)&&after.current.includes(CORNER_FACELETS[state.cp.indexOf(4)][0])&&after.current.includes(EDGE_FACELETS[state.ep.indexOf(8)][0]);})()`),true);
});
test('orientation marks pieces without inventing a home destination',()=>{
 assert.equal(run(`(() => {let state=solvedCubie();state.eo[0]=state.eo[1]=1;const target=makeFormulaTarget(state,Array.from({length:12},(_,i)=>['e',i]),'orientation');const view=formulaTargetView(state,target);return target.pieces.length===2&&view.current.length===4&&view.destinations.length===0;})()`),true);
});
test('completed pieces are not marked as needing correction',()=>assert.equal(run(`makeFormulaTarget(solvedCubie(),[['c',4],['e',8]],'solved').pieces.length`),0));
test('all formula targets resolve correctly and F2L marks its actual pair',()=>{
 assert.equal(run(`(() => {let seed=573;for(const method of Object.keys(METHOD_NAMES))for(let trial=0;trial<10;trial++){let state=solvedCubie();for(let i=0;i<25;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;state=methodApply(state,[seed%18]);}const plan=solveByMethod(state,method,library);let cursor=0;for(const formula of plan.formulas){state=methodApply(state,plan.moves.slice(cursor,formula.start));const target=formula.targets;if(!target||!Array.isArray(target.pieces))return false;const view=formulaTargetView(state,target);const expected=[];for(const [kind,piece] of target.pieces){const perm=kind==='c'?state.cp:state.ep;const topology=kind==='c'?CORNER_FACELETS:EDGE_FACELETS;expected.push(...topology[perm.indexOf(piece)]);}if(view.current.length!==new Set(expected).size)return false;if(formula.label.startsWith('Pasangan F2L')&&(target.pieces.length<1||target.pieces.length>2))return false;state=methodApply(state,plan.moves.slice(formula.start,formula.end));cursor=formula.end;}}return true;})()`),true);
});
