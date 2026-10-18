/* Human-method planning. Each stage is verified against its actual cube goal. */
const METHOD_NAMES={auto:'Automatik · Empat fasa',beginner:'Beginner · LBL',cfop2:'CFOP mudah · 2-Look',cfop:'CFOP penuh',zz:'ZZ · EOLine'};
const METHOD_SLOTS=[{corner:4,edge:8,right:"R U R' U'",left:"F' U' F U"},{corner:5,edge:9,right:"F U F' U'",left:"L' U' L U"},{corner:6,edge:10,right:"L U L' U'",left:"B' U' B U"},{corner:7,edge:11,right:"B U B' U'",left:"R' U' R U"}];
function methodParse(alg){return alg.trim().split(/\s+/).filter(Boolean).map(token=>{const index=MOVE_NAMES.indexOf(token);if(index<0)throw Error('Notasi formula tidak disokong: '+token);return index;});}
function methodApply(state,moves){let result=state;for(const m of moves)result=multiplyCubie(result,ALL_MOVES[m]);return result;}
const methodInverse=moves=>moves.slice().reverse().map(inverseMoveIndex);
function methodAction(alg){const moves=Array.isArray(alg)?alg:methodParse(alg);return {moves,transform:methodApply(solvedCubie(),moves)};}
const methodU=[0,1,2].map(m=>methodAction([m]));
const methodPatternCache=new Map();
function methodPieceValue(state,kind,piece){const perm=kind==='c'?state.cp:state.ep,ori=kind==='c'?state.co:state.eo,n=kind==='c'?3:2;const pos=perm.indexOf(piece);return pos*n+ori[pos];}
function methodPattern(pieces,actions){
 const cacheKey=pieces.map(p=>p.join('')).join('/')+'|'+actions.map(a=>a.moves.join(',')).join(';');if(methodPatternCache.has(cacheKey))return methodPatternCache.get(cacheKey);
 const size=24**pieces.length,dist=new Uint8Array(size).fill(255),queue=new Uint32Array(size);let target=0,weight=1;
 for(const [kind,piece] of pieces){target+=piece*(kind==='c'?3:2)*weight;weight*=24;}
 const transitions=actions.map(action=>pieces.map(([kind])=>{const perm=kind==='c'?action.transform.cp:action.transform.ep,ori=kind==='c'?action.transform.co:action.transform.eo,n=kind==='c'?3:2;return Array.from({length:24},(_,value)=>{const pos=perm.indexOf(Math.floor(value/n));return pos*n+(value%n+ori[pos])%n;});}));
 dist[target]=0;queue[0]=target;let tail=1;
 const next=(key,a)=>{let value=0,factor=1;for(let p=0;p<pieces.length;p++){value+=transitions[a][p][key%24]*factor;key=Math.floor(key/24);factor*=24;}return value;};
 for(let head=0;head<tail;head++){const key=queue[head];for(let a=0;a<actions.length;a++){const value=next(key,a);if(dist[value]===255){dist[value]=dist[key]+1;queue[tail++]=value;}}}
 const pattern={dist,next,key:state=>{let value=0,factor=1;for(const [kind,piece] of pieces){value+=methodPieceValue(state,kind,piece)*factor;factor*=24;}return value;}};methodPatternCache.set(cacheKey,pattern);return pattern;
}
function methodSolvePattern(state,pieces,actions){const p=methodPattern(pieces,actions);let key=p.key(state);if(p.dist[key]===255)throw Error('Kes tidak ditemui untuk peringkat teknik ini.');const chosen=[];while(p.dist[key]>0){let found=false;for(let a=0;a<actions.length;a++){const value=p.next(key,a);if(p.dist[value]===p.dist[key]-1){chosen.push(actions[a]);key=value;found=true;break;}}if(!found)throw Error('Jadual peringkat tidak lengkap.');}return chosen;}
function methodSlotActions(slots,eo=false){const algs=slots.flatMap(slot=>eo?[slot.corner===4?slot.right:slot.corner===5?slot.left:slot.corner===6?slot.right:slot.left]:[slot.right,slot.left]);return [...methodU,...algs.flatMap(alg=>{const action=methodAction(alg);return [action,methodAction(methodInverse(action.moves))];})];}
// Remove rotations/wide notation by tracking its centre frame; output is face turns
// in the user's fixed U/R/F/D/L/B frame, so the displayed formula matches animation.
function methodCompile(algorithm){const decomposed={r:['x','L'],l:["x'",'R'],u:['y','D'],d:["y'",'U'],f:['z','B'],b:["z'",'F'],M:["x'",'R',"L'"],E:["y'",'U',"D'"],S:['z',"F'",'B']};let frame=TutorialCube.solved();const result=[];
 function process(token){const base=token[0],turns=token.includes('2')?2:token.includes("'")?3:1;if('xyz'.includes(base)){frame=TutorialCube.apply(frame,[token]);return;}if(decomposed[base]){for(let i=0;i<turns;i++)for(const part of decomposed[base])process(part);return;}const face=FACE_NAMES.indexOf(base);const mapped=frame[face*9+4];result.push(mapped*3+(turns===3?2:turns-1));}
 for(const token of TutorialCube.parse(algorithm))process(token);
 return simplifyMoves(result);
}
function methodOLLSignature(s){return s.co.slice(0,4).join('')+'/'+s.eo.slice(0,4).join('');}
function methodTopOriented(s){return s.co.every(v=>v===0)&&s.eo.every(v=>v===0);}
function methodF2L(s){return [4,5,6,7].every(i=>s.cp[i]===i&&s.co[i]===0)&&[4,5,6,7,8,9,10,11].every(i=>s.ep[i]===i&&s.eo[i]===0);}
function methodFinished(s){return s.cp.every((v,i)=>v===i)&&s.ep.every((v,i)=>v===i)&&s.co.every(v=>v===0)&&s.eo.every(v=>v===0);}
function methodChooseOrient(state,algorithms,goal){if(goal(state))return {moves:[],label:''};for(let u=-1;u<3;u++){const setup=u<0?[]:[u],prepared=methodApply(state,setup);for(const algorithm of algorithms){const moves=methodCompile(algorithm.alg),result=methodApply(prepared,moves);if(goal(result))return {moves:[...setup,...moves],label:algorithm.name};}}throw Error('Formula orientasi tidak ditemui.');}
function methodChoosePLL(state,algorithms){if(methodFinished(state))return {moves:[],label:''};for(let u=-1;u<3;u++){const setup=u<0?[]:[u],prepared=methodApply(state,setup);for(const algorithm of [{alg:''},...algorithms]){const moves=algorithm.alg?methodCompile(algorithm.alg):[],result=methodApply(prepared,moves);for(let auf=-1;auf<3;auf++){const ending=auf<0?[]:[auf];if(methodFinished(methodApply(result,ending)))return {moves:[...setup,...moves,...ending],label:algorithm.name||'Pelarasan U · AUF'};}}}throw Error('Formula PLL tidak ditemui.');}
function methodSmallSearch(state,actions,goal,key,maxDepth=5){if(goal(state))return [];const queue=[{state,path:[]}],seen=new Set([key(state)]);for(let i=0;i<queue.length;i++){const item=queue[i];if(item.path.length>=maxDepth)continue;for(const action of actions){const next=methodApply(item.state,action.moves),path=[...item.path,action];if(goal(next))return path.flatMap(a=>a.moves);const signature=key(next);if(!seen.has(signature)){seen.add(signature);queue.push({state:next,path});}}}throw Error('Peringkat tidak dapat diselesaikan dengan formula teknik ini.');}
function solveByMethod(initial,method,library){
 if(!METHOD_NAMES[method])throw Error('Teknik tidak dikenali.');
 let state=initial;const moves=[],stages=[],formulas=[];let stage;
 function begin(name,goal,pieces=[],mode='solved'){if(stage){stage.end=moves.length;if(!stage.goal(state))throw Error('Semakan peringkat gagal: '+stage.name);}stage={name,start:moves.length,end:moves.length,goal,pieces,mode};stages.push(stage);}
 function add(sequence,label,targets=null){if(!sequence.length)return;targets=targets||(stage.pieces.length?makeFormulaTarget(state,stage.pieces,stage.mode,label):affectedFormulaTarget(state,sequence));const start=moves.length;state=methodApply(state,sequence);moves.push(...sequence);formulas.push({start,end:moves.length,label,formula:sequence.map(m=>MOVE_NAMES[m]).join(' '),stage:stages.length-1,targets});}
 function choice(result,label){add(result.moves,result.label||label);}
 function pattern(pieces,actions,label){for(const action of methodSolvePattern(state,pieces,actions))add(action.moves,label,makeFormulaTarget(state,pieces,'solved',label));}
 const cross=s=>[4,5,6,7].every(i=>s.ep[i]===i&&s.eo[i]===0),base=s=>cross(s)&&[4,5,6,7].every(i=>s.cp[i]===i&&s.co[i]===0);
 const oll=library.filter(a=>a.group==='OLL'),ocll=oll.filter(a=>/^oll-(21|22|23|24|25|26|27)$/.test(a.id)),pll=library.filter(a=>a.group==='PLL');
 if(method==='auto'){
   let previous=0,cursorState=initial;const names=['Orientasi tepi · EO','Orientasi bucu & E-slice','Kumpulan separuh pusingan','Lengkapkan kiub'];
   const all=solveCubeState(initial,(phase,phaseMoves)=>{const start=previous,end=phaseMoves.length;stages.push({name:names[phase],start,end});if(end>start){const sequence=phaseMoves.slice(start,end);let targets;if(phase===0)targets=makeFormulaTarget(cursorState,Array.from({length:12},(_,i)=>['e',i]),'orientation',names[phase]);else if(phase===3)targets=makeFormulaTarget(cursorState,[...Array.from({length:8},(_,i)=>['c',i]),...Array.from({length:12},(_,i)=>['e',i])],'solved',names[phase]);else targets=affectedFormulaTarget(cursorState,sequence,'Kepingan terlibat');formulas.push({start,end,label:names[phase],formula:sequence.map(m=>MOVE_NAMES[m]).join(' '),stage:phase,targets});cursorState=methodApply(cursorState,sequence);}previous=end;});
   return {method,moves:all,stages,formulas};
 }
 if(method==='zz'){
   begin('Orientasi tepi · EO',s=>s.eo.every(v=>v===0),Array.from({length:12},(_,i)=>['e',i]),'orientation');initSolverTables();let coord=getEOIndex(state);const eoMoves=[];while(distEO[coord]>0){let found=false;for(let m=0;m<18;m++){const next=moveEO[coord*18+m];if(distEO[next]===distEO[coord]-1){eoMoves.push(m);coord=next;found=true;break;}}if(!found)throw Error('EO tidak lengkap.');}add(eoMoves,'Betulkan orientasi tepi');
   begin('Garis bawah · EOLine',s=>s.eo.every(v=>v===0)&&[5,7].every(i=>s.ep[i]===i));pattern([['e',5],['e',7]],PHASE_MOVES[1].map(m=>methodAction([m])),'Bina garis DF–DB');
   begin('Blok kiri & kanan · F2L',methodF2L);const rul=[0,1,2,3,4,5,12,13,14].map(m=>methodAction([m]));pattern([['e',4],['e',6]],rul,'Masukkan tepi bawah sisi');
 }else{begin('Salib bawah · Cross',cross);pattern([4,5,6,7].map(i=>['e',i]),ALL_MOVES.map((_,m)=>methodAction([m])),'Bina Cross');}
 if(method==='beginner'){
   begin('Bucu lapisan pertama',base);for(let slot=0;slot<4;slot++)pattern([['c',METHOD_SLOTS[slot].corner]],methodSlotActions(METHOD_SLOTS.slice(slot)),'Masukkan bucu');
   begin('Tepi lapisan kedua',methodF2L);
   const right=methodParse("U R U' R' U' F' U F"),left=methodParse("U' L' U L U F U' F'");
   for(let i=0;i<4;i++){const target=8+i;const actions=[...methodU];
     for(let j=0;j<4;j++){const frame=TutorialCube.apply(TutorialCube.solved(),Array(j).fill('y'));for(const sequence of [right,left]){const action=methodAction(sequence.map(m=>frame[Math.floor(m/3)*9+4]*3+m%3));if([8,9,10,11].filter(k=>k<target).every(k=>action.transform.ep[k]===k&&action.transform.eo[k]===0))actions.push(action,methodAction(methodInverse(action.moves)));}}
     pattern([['e',target]],actions,'Masukkan tepi lapisan kedua');}
 }else{
   if(method!=='zz')begin('Empat pasangan · F2L',methodF2L);
   for(let slot=0;slot<4;slot++)pattern([['c',METHOD_SLOTS[slot].corner],['e',METHOD_SLOTS[slot].edge]],methodSlotActions(METHOD_SLOTS.slice(slot),method==='zz'),'Pasangan F2L '+(slot+1));
 }
 if(method==='beginner'||method==='cfop2'){
   begin('Salib atas · 2-Look OLL (tepi)',s=>methodF2L(s)&&s.eo.every(v=>v===0),[0,1,2,3].map(i=>['e',i]),'orientation');const crossActions=[...methodU,methodAction("F R U R' U' F'")];add(methodSmallSearch(state,crossActions,s=>s.eo.every(v=>v===0),s=>s.eo.slice(0,4).join(''),7),'Orientasi tepi atas');
 }
 if(method==='beginner'){
   begin('Padankan tepi atas',s=>methodF2L(s)&&s.ep.every((v,i)=>v===i)&&s.eo.every(v=>v===0),[0,1,2,3].map(i=>['e',i]),'permutation');add(methodSmallSearch(state,[...methodU,methodAction("R U R' U R U2 R' U")],s=>s.ep.every((v,i)=>v===i),s=>s.ep.slice(0,4).join(','),7),'Kitar tepi atas');
   begin('Letakkan bucu atas',s=>methodF2L(s)&&s.cp.every((v,i)=>v===i)&&s.ep.every((v,i)=>v===i),[0,1,2,3].map(i=>['c',i]),'permutation');const cornerCycle=methodAction("U R U' L' U R' U' L");const cornerActions=[];for(let u=-1;u<3;u++){const setup=u<0?[]:[u];const action=methodAction([...setup,...cornerCycle.moves,...methodInverse(setup)]);cornerActions.push(action,methodAction(methodInverse(action.moves)));}add(methodSmallSearch(state,cornerActions,s=>s.cp.every((v,i)=>v===i),s=>s.cp.slice(0,4).join(','),4),'Kitar bucu atas');
   begin('Arahkan bucu · Selesai',methodFinished,[0,1,2,3].map(i=>['c',i]),'orientation');if(!methodFinished(state)){for(let turn=0;turn<4;turn++){let guard=0;while(state.co[0]!==0){if(++guard>3)throw Error('Orientasi bucu tidak lengkap.');add(methodParse("R' D' R D R' D' R D"),'Putar bucu UFR',makeFormulaTarget(state,[['c',state.cp[0]]],'orientation','Putar bucu UFR'));}add([0],'Bawa bucu seterusnya ke UFR');}}
 }else{
   begin(method==='cfop'?'Orientasi seluruh muka atas · OLL':'Orientasi bucu atas · OCLL',s=>methodF2L(s)&&methodTopOriented(s),[...Array.from({length:4},(_,i)=>['c',i]),...Array.from({length:4},(_,i)=>['e',i])],'orientation');choice(methodChooseOrient(state,method==='cfop'?oll:ocll,s=>methodTopOriented(s)),method==='cfop'?'Formula OLL':'Formula OCLL');
   if(method==='cfop2'){
     begin('Kedudukan bucu · 2-Look PLL',s=>methodF2L(s)&&methodTopOriented(s)&&s.cp.every((v,i)=>v===i),[0,1,2,3].map(i=>['c',i]),'permutation');const actions=[...methodU,...pll.filter(a=>['pll-t','pll-y'].includes(a.id)).map(a=>methodAction(methodCompile(a.alg)))];add(methodSmallSearch(state,actions,s=>s.cp.every((v,i)=>v===i),s=>s.cp.slice(0,4).join(','),4),'Susun bucu atas');
     begin('Kedudukan tepi · 2-Look PLL',methodFinished,[0,1,2,3].map(i=>['e',i]),'permutation');choice(methodChoosePLL(state,pll.filter(a=>['pll-ua','pll-ub','pll-h','pll-z'].includes(a.id))),'Susun tepi atas');
   }else{begin('Kedudukan lapisan akhir · PLL',methodFinished,[...Array.from({length:4},(_,i)=>['c',i]),...Array.from({length:4},(_,i)=>['e',i])],'permutation');choice(methodChoosePLL(state,pll),'Formula PLL');}
 }
 stage.end=moves.length;if(!stage.goal(state)||!methodFinished(state))throw Error('Penyelesaian teknik belum lengkap.');return {method,moves,stages:stages.map(({goal,pieces,mode,...rest})=>rest),formulas};
}
