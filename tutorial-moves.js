/* Geometry-based notation for the teaching cube. Independent of the user's solver state. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TutorialCube=api;})(globalThis,()=>{
  const faces=['U','R','F','D','L','B'];
  const colors=['#FFD500','#C41E24','#1D63B8','#FFFFFF','#FF6B00','#159E2A'];
  function geometry(index){const face=Math.floor(index/9),row=Math.floor(index%9/3),col=index%3;
    if(face===0)return {pos:[col-1,1,row-1],normal:[0,1,0]};
    if(face===1)return {pos:[1,1-row,1-col],normal:[1,0,0]};
    if(face===2)return {pos:[col-1,1-row,1],normal:[0,0,1]};
    if(face===3)return {pos:[col-1,-1,1-row],normal:[0,-1,0]};
    if(face===4)return {pos:[-1,1-row,col-1],normal:[-1,0,0]};
    return {pos:[1-col,1-row,-1],normal:[0,0,-1]};
  }
  const stickers=Array.from({length:54},(_,i)=>geometry(i));
  const key=(p,n)=>p.join(',')+'/'+n.join(',');
  const indices=new Map(stickers.map((s,i)=>[key(s.pos,s.normal),i]));
  const definitions={U:[1,-1,1],R:[0,-1,1],F:[2,-1,1],D:[1,1,-1],L:[0,1,-1],B:[2,1,-1],M:[0,1,0],E:[1,1,0],S:[2,-1,0],x:[0,-1,null],y:[1,-1,null],z:[2,-1,null]};
  function parse(algorithm){
    const input=String(algorithm).replace(/[’′]/g,"'").trim();
    let offset=0;
    function sequence(nested=false){const result=[];while(offset<input.length){
      if(/[\s,]/.test(input[offset])){offset++;continue;}
      if(input[offset]===')'){if(!nested)throw Error('Kurungan tidak sepadan');offset++;return result;}
      if(input[offset]==='('){offset++;const group=sequence(true);const match=input.slice(offset).match(/^\d+/);let repeat=1;if(match){repeat=Number(match[0]);offset+=match[0].length;}if(repeat>12)throw Error('Ulangan terlalu panjang');for(let r=0;r<repeat;r++)result.push(...group);continue;}
      const match=input.slice(offset).match(/^([URFDLBMESxyzurfdlb])([w]?)(2'?|')?/);
      if(!match)throw Error('Notasi tidak dikenali: '+input.slice(offset));
      const base=match[2]?match[1].toLowerCase():match[1];
      if(match[2]&&!/[URFDLB]/.test(match[1]))throw Error('Wide move tidak sah');
      result.push(base+(match[3]?.includes('2')?'2':match[3]||''));offset+=match[0].length;
      if(result.length>400)throw Error('Formula terlalu panjang');
    }if(nested)throw Error('Kurungan tidak lengkap');return result;}
    return sequence();
  }
  function spec(token){const base=token[0],wide=/[urfdlb]/.test(base),definition=definitions[wide?base.toUpperCase():base];if(!definition)throw Error('Pusingan tidak dikenali');
    const [axis,sign,layer]=definition;const turns=token.includes('2')?2:token.includes("'")?-1:1;
    return {axis,axisName:['x','y','z'][axis],sign,layer,wide,turns,angle:sign*turns*Math.PI/2,affects:pos=>layer===null||(wide?(layer===1?pos[axis]>=0:pos[axis]<=0):pos[axis]===layer)};
  }
  function rotate([x,y,z],axis,sign){if(axis===0)return sign===1?[x,-z,y]:[x,z,-y];if(axis===1)return sign===1?[z,y,-x]:[-z,y,x];return sign===1?[-y,x,z]:[y,-x,z];}
  const permutationCache=new Map();
  function permutation(token){if(permutationCache.has(token))return permutationCache.get(token);const move=spec(token),result=Array(54);
    for(let i=0;i<54;i++){let {pos,normal}=stickers[i];if(move.affects(pos)){for(let t=0;t<Math.abs(move.turns);t++){pos=rotate(pos,move.axis,move.sign*Math.sign(move.turns));normal=rotate(normal,move.axis,move.sign*Math.sign(move.turns));}}result[indices.get(key(pos,normal))]=i;}
    permutationCache.set(token,result);return result;
  }
  const solved=()=>Array.from({length:54},(_,i)=>Math.floor(i/9));
  function apply(state,algorithm){let result=state.slice();for(const token of Array.isArray(algorithm)?algorithm:parse(algorithm)){const p=permutation(token);result=p.map(i=>result[i]);}return result;}
  const inverse=algorithm=>(Array.isArray(algorithm)?algorithm:parse(algorithm)).slice().reverse().map(token=>token.includes('2')?token:token.endsWith("'")?token.slice(0,-1):token+"'");
  const caseFor=algorithm=>apply(solved(),inverse(algorithm));
  const isSolved=state=>faces.every((_,face)=>state.slice(face*9,face*9+9).every(c=>c===state[face*9+4]));
  function describe(token){const names={U:'atas (Up)',D:'bawah (Down)',R:'kanan (Right)',L:'kiri (Left)',F:'hadapan (Front)',B:'belakang (Back)',M:'hirisan tengah, arah L (Middle)',E:'hirisan mendatar, arah D (Equator)',S:'hirisan depan, arah F (Standing)',x:'seluruh kiub, arah R',y:'seluruh kiub, arah U',z:'seluruh kiub, arah F'};const base=token[0],wide=/[urfdlb]/.test(base);return `${wide?'Dua lapisan ':''}${names[wide?base.toUpperCase():base]} · ${token.includes('2')?'180°':token.includes("'")?'90° lawan jam':'90° ikut jam'}`;}
  return {faces,colors,geometry,parse,spec,permutation,solved,apply,inverse,caseFor,isSolved,describe};
});
