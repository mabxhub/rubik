/* Tutorials use a separate cube: opening, practising and closing never edits facelets. */
(() => {
  const C=TutorialCube;
  let data,algorithms=[],demo=null,lastFocus=null;
  const dialog=document.getElementById('tutorialDialog');
  const content=document.getElementById('tutorialContent');
  const title=document.getElementById('tutorialTitle');
  const nav=document.getElementById('tutorialNav');
  const back=document.getElementById('tutorialBack');
  const progressKey='rubik-tutorial-progress';
  const escape=text=>String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function boldMoves(text){
    return escape(text).replace(/(^|[^\p{L}\p{N}_])((?:[URFDLB](?:w)?(?:2[′’]?|[′’])?)+)(?=$|[^\p{L}\p{N}_])/gu,'$1<strong class="tutorial-move">$2</strong>');
  }
  function create(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.innerHTML=boldMoves(text);return node;}
  function button(label,fn,className=''){const b=create('button',className,label);b.type='button';b.addEventListener('click',fn);return b;}
  const clear=()=>{if(demo){demo.dispose();demo=null;}content.replaceChildren();nav.replaceChildren();content.scrollTop=0;};
  const savedProgress=()=>{try{return JSON.parse(localStorage.getItem(progressKey))||{};}catch{return {};}};
  function saveProgress(id,index){try{localStorage.setItem(progressKey,JSON.stringify({...savedProgress(),[id]:index}));}catch{}}
  function setBack(fn){back.classList.toggle('hidden',!fn);back.onclick=fn;}
  function goalVisible(kind,index){const {pos}=C.geometry(index);const face=Math.floor(index/9),cell=index%9,center=cell===4;
    if(kind==='solved')return true;
    if(kind==='cross')return center||(face===3&&[1,3,5,7].includes(cell))||([1,2,4,5].includes(face)&&cell===7);
    if(kind==='layer1')return center||pos[1]===-1;
    if(kind==='f2l')return center||pos[1]<=0;
    if(kind==='yellowcross')return center||pos[1]<=0||(face===0&&[1,3,5,7].includes(cell));
    if(kind==='oll'||kind==='edges')return center||pos[1]<=0||face===0;
    if(kind==='corners')return center||(Math.abs(pos[0])===1&&Math.abs(pos[2])===1);
    if(kind==='block1')return center||(pos[0]===-1&&pos[1]<=0);
    if(kind==='blocks')return center||(Math.abs(pos[0])===1&&pos[1]<=0);
    if(kind==='cmll')return center||(Math.abs(pos[0])===1&&(pos[1]<=0||Math.abs(pos[2])===1));
    if(kind==='line')return center||(face===3&&[1,7].includes(cell))||([2,5].includes(face)&&cell===7);
    if(kind==='block222')return center||(pos[0]<=0&&pos[1]<=0&&pos[2]<=0);
    if(kind==='block223')return center||(pos[0]<=0&&pos[1]<=0);
    if(kind==='squares')return center||(pos[1]<=0&&(pos[0]===-1||pos[2]===-1));
    return center;
  }
  function diagram(state,caption,kind){
    const coords=[[100,20],[190,110],[100,110],[100,200],[10,110],[280,110]];
    let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 290" role="img" aria-label="'+escape(caption)+'"><title>'+escape(caption)+'</title>';
    coords.forEach(([x,y],face)=>{svg+=`<text x="${x+39}" y="${y-4}" text-anchor="middle" fill="#334155" font-size="12" font-family="system-ui" font-weight="700">${C.faces[face]}</text>`;
      for(let i=0;i<9;i++){const index=face*9+i;const color=kind&&!goalVisible(kind,index)?'#cbd5e1':C.colors[state[index]];svg+=`<rect x="${x+(i%3)*26}" y="${y+Math.floor(i/3)*26}" width="24" height="24" rx="3" fill="${color}" stroke="#253344" stroke-width="1.5"/>`;}
    });svg+='</svg>';
    const figure=create('figure','tutorial-figure');
    const picture=create('div','tutorial-diagram-picture');
    let cube=false,pitch=.48,yaw=-.55,pointer=null,lastX=0,lastY=0;
    const toggle=button('',()=>{cube=!cube;render();},'tutorial-diagram-toggle');
    const label=create('figcaption','',caption);
    function rotate([x,y,z]){const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);return [xx,y*Math.cos(pitch)-zz*Math.sin(pitch),y*Math.sin(pitch)+zz*Math.cos(pitch)];}
    function project(point){const p=rotate(point);return [185+p[0]*48,145-p[1]*48];}
    function points(center,horizontal,vertical,size){return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>project(center.map((value,i)=>value+u*horizontal[i]*size+v*vertical[i]*size))).map(p=>p.map(value=>value.toFixed(2)).join(',')).join(' ');}
    function cubeSvg(){
      let result='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 290" role="img" aria-label="'+escape(caption+' · kiub boleh diputar')+'"><title>'+escape(caption)+'</title>';
      const faces=C.faces.map((name,face)=>{const {normal}=C.geometry(face*9+4);return {face,name,normal,depth:rotate(normal)[2]};}).filter(face=>face.depth>.001).sort((a,b)=>a.depth-b.depth);
      for(const {face,name,normal} of faces){
        const first=C.geometry(face*9).pos;
        const horizontal=C.geometry(face*9+1).pos.map((value,i)=>value-first[i]);
        const vertical=C.geometry(face*9+3).pos.map((value,i)=>value-first[i]);
        const faceCenter=normal.map(value=>value*1.504);
        result+=`<polygon points="${points(faceCenter,horizontal,vertical,1.5)}" fill="#111b26" stroke="#111b26" stroke-width="2" stroke-linejoin="round"/>`;
        for(let cell=0;cell<9;cell++){
          const index=face*9+cell,{pos}=C.geometry(index);
          const center=pos.map((value,i)=>value+normal[i]*.506);
          const color=kind&&!goalVisible(kind,index)?'#cbd5e1':C.colors[state[index]];
          result+=`<polygon data-facelet="${index}" points="${points(center,horizontal,vertical,.445)}" fill="${color}" stroke="#111b26" stroke-width="1.6" stroke-linejoin="round"/>`;
        }
        const [x,y]=project(faceCenter);
        result+=`<circle cx="${x}" cy="${y}" r="10" fill="#172b4ddd"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="white" font-size="12" font-family="system-ui" font-weight="800">${name}</text>`;
      }
      return result+'</svg>';
    }
    function render(){
      figure.dataset.view=cube?'cube':'net';
      picture.innerHTML=cube?cubeSvg():svg;
      toggle.setAttribute('aria-pressed',String(cube));
      toggle.setAttribute('aria-label',cube?'Tukar kepada bentuk terbuka':'Tukar kepada kiub');
      toggle.title=cube?'Bentuk terbuka':'Kiub';
      toggle.innerHTML=cube?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h7v7H8zM1 9h7v7H1zM8 9h7v7H8zM15 9h7v7h-7zM8 16h7v7H8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10 9-5M12 12 3 7m9 5v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      label.textContent=caption+(cube?' · seret untuk putar':'');
    }
    picture.addEventListener('pointerdown',event=>{if(!cube||pointer!==null)return;pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;picture.setPointerCapture(pointer);});
    picture.addEventListener('pointermove',event=>{if(!cube||event.pointerId!==pointer)return;yaw+=(event.clientX-lastX)*.009;pitch+=(event.clientY-lastY)*.009;lastX=event.clientX;lastY=event.clientY;render();});
    const end=event=>{if(event.pointerId!==pointer)return;if(picture.hasPointerCapture(pointer))picture.releasePointerCapture(pointer);pointer=null;};
    picture.addEventListener('pointerup',end);picture.addEventListener('pointercancel',end);picture.addEventListener('lostpointercapture',()=>pointer=null);
    figure.append(toggle,picture,label);render();return figure;
  }
  async function open(){
    lastFocus=document.activeElement;
    if(typeof stopAuto==='function')stopAuto();
    dialog.showModal();
    title.textContent='Tutorial Rubik';setBack(null);clear();content.append(create('p','','Memuatkan tutorial…'));
    try{if(!data){const responses=await Promise.all([fetch('./tutorial-methods.json'),fetch('./tutorial-algorithms.json')]);if(responses.some(r=>!r.ok))throw Error('load');const [methods,library]=await Promise.all(responses.map(r=>r.json()));data=methods;algorithms=[...data.extraAlgorithms,...library];}renderMenu();}
    catch{content.replaceChildren(create('p','','Tutorial belum dapat dimuatkan. Sambung internet untuk pemasangan pertama, kemudian cuba lagi.'));content.append(button('Cuba lagi',()=>{dialog.close();open();}));}
  }
  function renderMenu(){clear();title.textContent='Tutorial Rubik';setBack(null);
    content.append(create('p','tutorial-lead','Pilih teknik. Belajar satu langkah pada satu masa.'));
    const search=create('input','tutorial-search');search.type='search';search.placeholder='Cari teknik atau formula…';search.setAttribute('aria-label','Cari tutorial');content.append(search);
    const list=create('div','tutorial-method-list');content.append(list);
    function populate(){list.replaceChildren();const query=search.value.toLowerCase();for(const method of data.methods){if(!`${method.name} ${method.english} ${method.level}`.toLowerCase().includes(query))continue;const tile=button('',()=>renderLesson(method,Math.min(savedProgress()[method.id]||0,method.steps.length-1)),'tutorial-method');tile.append(create('span','tutorial-level',method.level),create('strong','',method.name),create('span','tutorial-english',method.english),create('span','',method.summary));list.append(tile);}
      for(const [group,count] of [['OLL',57],['PLL',21],['CMLL',42]]){if(query&&!`${group} formula pustaka`.toLowerCase().includes(query))continue;const tile=button('',()=>renderLibrary(group),'tutorial-method tutorial-library-link');tile.append(create('span','tutorial-level','Pustaka formula'),create('strong','',`${count} kes ${group}`),create('span','', 'Gambar kes · formula · latihan 3D'));list.append(tile);}
      if(!list.children.length)list.append(create('p','','Tiada padanan. Cuba CFOP, Roux atau PLL.'));
    }search.addEventListener('input',populate);populate();
    content.append(create('p','tutorial-note','Kaedah utama dan konsep lanjutan 3×3. Variasi komuniti terus berkembang; pustaka ini bukan senarai setiap variasi yang pernah dicipta.'));
  }
  function renderLesson(method,index){clear();saveProgress(method.id,index);setBack(renderMenu);title.textContent=method.name;
    const lesson=method.steps[index];content.append(create('p','tutorial-kicker',`${index+1} / ${method.steps.length} · ${method.english}`),create('h3','',lesson.title));
    content.append(diagram(C.solved(),'Sasaran langkah · bahagian lain dikelabukan',lesson.diagram));
    for(const paragraph of lesson.body)content.append(create('p','',paragraph));
    if(lesson.tip)content.append(create('p','tutorial-tip',lesson.tip));
    if(lesson.algs){content.append(create('h4','','Formula & kes contoh'));for(const id of lesson.algs){const alg=algorithms.find(a=>a.id===id);if(alg)content.append(algorithmCard(alg,()=>renderLesson(method,index)));}}
    if(lesson.library)content.append(button(`Buka pustaka ${lesson.library}`,()=>renderLibrary(lesson.library,()=>renderLesson(method,index)),'tutorial-primary'));
    const refs=create('details','tutorial-sources');refs.append(create('summary','','Rujukan pembelajaran'));for(const url of method.sources){const link=create('a','',new URL(url).hostname.replace('www.',''));link.href=url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);}content.append(refs);
    nav.append(button('‹ Sebelumnya',()=>renderLesson(method,index-1)),create('span','',`${index+1} / ${method.steps.length}`),button(index===method.steps.length-1?'Senarai teknik':'Seterusnya ›',()=>index===method.steps.length-1?renderMenu():renderLesson(method,index+1)));
    nav.firstChild.disabled=index===0;
  }
  function algorithmCard(algorithm,onBack){const card=create('article','tutorial-algorithm');card.append(create('h4','',algorithm.name),diagram(C.caseFor(algorithm.alg),'Kes mula · lihat semua enam muka'),create('code','tutorial-formula',algorithm.alg));card.append(button('▶ Cuba formula',()=>renderDemo(algorithm,onBack),'tutorial-primary'));return card;}
  function renderLibrary(group,onBack=renderMenu){clear();setBack(onBack);title.textContent=`Pustaka ${group}`;
    content.append(create('p','tutorial-lead',group==='OLL'?'Kenali corak warna U, termasuk petak U di sisi.':group==='CMLL'?'Padankan bucu sahaja. Tepi M dalam gambar tidak penting untuk CMLL.':'Padankan warna lapisan atas dan pusat sisi.'));
    const search=create('input','tutorial-search');search.type='search';search.placeholder='Cari nama atau nombor kes';search.setAttribute('aria-label','Cari kes '+group);content.append(search);const list=create('div','tutorial-case-list');content.append(list);
    function populate(){list.replaceChildren();const entries=algorithms.filter(a=>a.group===group&&`${a.name} ${a.category}`.toLowerCase().includes(search.value.toLowerCase()));for(const a of entries)list.append(algorithmCard(a,()=>renderLibrary(group,onBack)));if(!entries.length)list.append(create('p','','Tiada kes sepadan.'));}
    search.addEventListener('input',populate);populate();
  }
  function renderDemo(algorithm,onBack){clear();setBack(onBack);title.textContent=algorithm.name;
    content.append(create('p','tutorial-note','Kiub latihan berasingan untuk formula ini. Seret untuk melihat muka lain. Ulangan dan persediaan pada kiub sebenar ikut arahan pelajaran. Arah jam dilihat terus pada muka yang dipusing.'));
    const stage=create('div','tutorial-stage');const canvas=create('canvas');canvas.setAttribute('aria-label','Kiub latihan formula 3D');stage.append(canvas);content.append(stage);
    const status=create('p','tutorial-demo-status');status.setAttribute('aria-live','polite');content.append(status);
    const tokens=C.parse(algorithm.alg);const formula=create('div','tutorial-tokens');tokens.forEach(token=>formula.append(create('span','',token)));content.append(formula);
    const controls=create('div','tutorial-demo-controls');const prev=button('◀',()=>demo?.previous());prev.setAttribute('aria-label','Pusingan sebelumnya');const play=button('▶ Main',()=>demo?.toggle(),'tutorial-primary');const next=button('▶',()=>demo?.next());next.setAttribute('aria-label','Pusingan seterusnya');const reset=button('↺',()=>demo?.reset());reset.setAttribute('aria-label','Mula semula formula');controls.append(prev,play,next,reset);content.append(controls);
    const select=create('select','tutorial-duration');select.setAttribute('aria-label','Tempoh pusingan latihan');for(const ms of [500,1000,1500,2000]){const option=create('option','',`${ms/1000} s / pusingan`);option.value=ms;option.selected=ms===1000;select.append(option);}content.append(select);
    const details=create('details','tutorial-sources');details.append(create('summary','','Kes mula & hasil akhir'));details.append(diagram(C.caseFor(tokens),'Kes mula'),diagram(C.solved(),'Hasil selepas formula lengkap'));const source=create('a','','Rujukan formula');source.href=algorithm.source;source.target='_blank';source.rel='noopener noreferrer';details.append(source);content.append(details);
    try{demo=new DemoCube(canvas,tokens,()=>Number(select.value),({index,playing,busy})=>{status.innerHTML=boldMoves(index===tokens.length?'✓ Formula selesai':`${index+1} / ${tokens.length} · ${tokens[index]} · ${C.describe(tokens[index])}`);[...formula.children].forEach((node,i)=>{node.classList.toggle('active',i===index);node.classList.toggle('done',i<index);});prev.disabled=busy||index===0;next.disabled=busy||index===tokens.length;reset.disabled=busy;play.disabled=index===tokens.length;play.textContent=playing?'Ⅱ Jeda':'▶ Main';});}
    catch{stage.replaceChildren(create('p','','Paparan 3D tidak tersedia. Gunakan gambar kes mula dan hasil akhir di bawah.'));prev.disabled=next.disabled=play.disabled=reset.disabled=true;}
  }
  class DemoCube{
    constructor(canvas,tokens,duration,onChange){this.canvas=canvas;this.tokens=tokens;this.duration=duration;this.onChange=onChange;this.index=0;this.playing=false;this.busy=false;this.disposed=false;this.state=C.caseFor(tokens);this.initial=this.state.slice();this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(36,1,.1,100);this.camera.position.set(0,0,10);this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));this.group=new THREE.Group();this.group.rotation.set(.48,-.5,0);this.scene.add(this.group);this.pivot=new THREE.Group();this.group.add(this.pivot);this.cubies=[];this.stickers=[];
      const geometry=new THREE.BoxGeometry(.98,.98,.98),material=new THREE.MeshBasicMaterial({color:0x101820});const map=new Map();for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);this.group.add(mesh);this.cubies.push({mesh,pos:[x,y,z]});map.set([x,y,z].join(','),mesh);}
      const stickerGeometry=new THREE.PlaneGeometry(.86,.86);for(let i=0;i<54;i++){const {pos,normal}=C.geometry(i);const mesh=new THREE.Mesh(stickerGeometry,new THREE.MeshBasicMaterial({color:C.colors[this.state[i]]}));mesh.position.set(...normal.map(n=>n*.502));mesh.lookAt(...normal);map.get(pos.join(',')).add(mesh);this.stickers.push(mesh);if(i%9===4){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#172b4ddd';ctx.beginPath();ctx.arc(64,64,53,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.font='bold 76px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(C.faces[Math.floor(i/9)],64,66);const label=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true}));label.position.z=.008;mesh.add(label);}}
      this.resize=()=>{if(this.disposed)return;const w=canvas.parentElement.clientWidth,h=canvas.parentElement.clientHeight;this.camera.aspect=w/Math.max(1,h);this.camera.position.z=2.9/Math.sin(Math.min(18*Math.PI/180,Math.atan(Math.tan(18*Math.PI/180)*this.camera.aspect)));this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.render();};this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas.parentElement);this.resize();
      let pointer=null,lastX=0,lastY=0;canvas.onpointerdown=e=>{pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(pointer);};canvas.onpointermove=e=>{if(e.pointerId!==pointer)return;const q=new THREE.Quaternion().setFromEuler(new THREE.Euler((e.clientY-lastY)*.006,(e.clientX-lastX)*.006,0));this.group.quaternion.premultiply(q);lastX=e.clientX;lastY=e.clientY;this.render();};canvas.onpointerup=canvas.onpointercancel=()=>pointer=null;this.notify();
    }
    render(){if(!this.disposed)this.renderer.render(this.scene,this.camera);}
    notify(){this.onChange({index:this.index,playing:this.playing,busy:this.busy});}
    animate(token,done){if(this.busy||this.disposed)return;this.busy=true;this.notify();const move=C.spec(token),layer=this.cubies.filter(c=>move.affects(c.pos));layer.forEach(c=>this.pivot.attach(c.mesh));const start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?1:this.duration();const tick=now=>{if(this.disposed)return;const t=Math.min(1,(now-start)/duration);const ease=t*t*(3-2*t);this.pivot.rotation[move.axisName]=move.angle*ease;this.render();if(t<1){this.frame=requestAnimationFrame(tick);return;}this.pivot.rotation.set(0,0,0);for(const c of layer){this.group.attach(c.mesh);c.mesh.position.set(...c.pos);c.mesh.rotation.set(0,0,0);}this.state=C.apply(this.state,[token]);this.sync();this.busy=false;done();this.notify();this.render();if(this.playing){if(this.index>=this.tokens.length){this.playing=false;this.notify();}else this.timer=setTimeout(()=>this.next(),120);}};this.frame=requestAnimationFrame(tick);}
    sync(){this.stickers.forEach((mesh,i)=>mesh.material.color.set(C.colors[this.state[i]]));}
    next(){if(this.busy||this.index>=this.tokens.length)return;this.animate(this.tokens[this.index],()=>this.index++);}
    previous(){if(this.busy||this.index===0)return;this.playing=false;clearTimeout(this.timer);this.animate(C.inverse([this.tokens[this.index-1]])[0],()=>this.index--);}
    toggle(){this.playing=!this.playing;clearTimeout(this.timer);this.notify();if(this.playing&&!this.busy)this.next();}
    reset(){if(this.busy)return;this.playing=false;clearTimeout(this.timer);this.index=0;this.state=this.initial.slice();this.sync();this.notify();this.render();}
    dispose(){this.disposed=true;clearTimeout(this.timer);cancelAnimationFrame(this.frame);this.observer.disconnect();this.canvas.onpointerdown=this.canvas.onpointermove=this.canvas.onpointerup=this.canvas.onpointercancel=null;const geometries=new Set(),materials=new Set();this.scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});this.renderer.dispose();}
  }
  document.getElementById('btnTutorial').addEventListener('click',open);
  document.getElementById('tutorialClose').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{clear();lastFocus?.focus();});
  dialog.addEventListener('cancel',()=>{if(demo)demo.playing=false;});
  window.addEventListener('pagehide',()=>{if(demo){demo.playing=false;clearTimeout(demo.timer);}});
})();
