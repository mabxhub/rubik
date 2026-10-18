/* Case notes are derived from the same geometry as the practice player. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tutorial-moves'));else root.TutorialNotes=factory(root.TutorialCube);})(globalThis,C=>{
  const groups={
    F2L:{before:'Salib D mesti siap. Cari bucu berwarna D dan tepi yang mempunyai dua warna sisi yang sama. Pegang slot sasaran di depan kanan: bucu DFR dan tepi FR.',result:'Pasangan DFR–FR masuk dengan orientasi betul. Salib D dan tiga pasangan lain kekal. Lapisan U masih boleh berselerak; teruskan pasangan seterusnya.',avoid:'Kes bercermin memerlukan formula pasangannya. Jangan tukar R kepada L sahaja: arah pusingan juga berubah. Untuk slot lain, putar seluruh kiub dengan y dahulu dan tentukan semula F serta R.'},
    OLL:{before:'Dua lapisan pertama (F2L) mesti siap. Warna pusat U ialah warna sasaran. Padankan semua petak warna U di atas DAN di sisi; warna sisi lain tidak menentukan kes OLL.',result:'Semua sembilan petak U menghadap atas, F2L kekal. Warna sisi lapisan U belum semestinya sepadan: teruskan PLL.',avoid:'Dua corak atas yang serupa boleh mempunyai kes berlainan apabila petak sisi berbeza. Jika U sudah lengkap, langkau OLL. Jangan ulang formula tanpa mengenal pasti corak baharu.'},
    PLL:{before:'F2L dan seluruh muka U mesti siap. Bandingkan bar warna sisi, pasangan bucu (headlights), serta warna pusat. Warna dalam rajah ialah contoh; padankan hubungan warna.',result:'Kepingan lapisan terakhir tersusun. Pada kiub sebenar, akhir sekali buat U, U′ atau U2 jika seluruh lapisan atas hanya tersasar satu putaran (AUF).',avoid:'Corak bercermin seperti Aa/Ab, Ua/Ub atau Ja/Jb menggunakan formula berlainan. Jika hanya AUF diperlukan, jangan buat satu PLL penuh.'},
    CMLL:{before:'Dua blok Roux kiri dan kanan 1×2×3 mesti siap. Padankan orientasi dan kedudukan EMPAT bucu U sahaja. Enam tepi LSE tidak digunakan untuk mengenal pasti CMLL.',result:'Empat bucu atas selesai sambil mengekalkan dua blok. Tepi tengah boleh berubah; sambung orientasi dan penyusunan LSE.',avoid:'Jangan padankan seluruh corak tepi seperti OLL/PLL. Rajah latihan menggunakan tepi contoh; pada kiub sebenar tepi boleh berbeza.'}
  };
  const position=pos=>[pos[1]===1?'U':pos[1]===-1?'D':'',pos[2]===1?'F':pos[2]===-1?'B':'',pos[0]===1?'R':pos[0]===-1?'L':''].join('');
  const pieces=new Map();for(let i=0;i<54;i++){const p=C.geometry(i).pos;if(p.filter(v=>v!==0).length<2)continue;const key=p.join(',');if(!pieces.has(key))pieces.set(key,[]);pieces.get(key).push(i);}
  function locate(state,colors){return [...pieces.values()].find(indices=>indices.length===colors.length&&colors.every(color=>indices.some(i=>state[i]===color)));}
  function variant(algorithm,turns=0){const turn=['','U','U2',"U'"][turns];const setup=turn?C.inverse(turn).join(' '):'';return {...algorithm,alg:[setup,algorithm.alg].filter(Boolean).join(' '),baseAlg:algorithm.alg,setup,turn};}
  function profile(algorithm,turns=0){
    const chosen=variant(algorithm,turns),state=C.caseFor(chosen.alg),group=groups[algorithm.group];const sections=[];
    if(group)sections.push(['Sebelum guna',group.before]);
    if(algorithm.group==='F2L'){
      const corner=locate(state,[3,2,1]),edge=locate(state,[2,1]);
      const sticker=corner.find(i=>state[i]===3);
      sections.push(['Kenali kes',`${algorithm.category}. Bucu sasaran berada di ${position(C.geometry(corner[0]).pos)}; petak warna D pada bucu menghadap ${C.faces[Math.floor(sticker/9)]}. Tepi sasaran berada di ${position(C.geometry(edge[0]).pos)}; warna F pada tepi menghadap ${C.faces[Math.floor(edge.find(i=>state[i]===2)/9)]}.`]);
    }else if(['OLL','CMLL'].includes(algorithm.group)){
      const upper=state[4];const cells=[0,1,2,3,5,6,7,8].filter(i=>state[i]===upper);const corners=cells.filter(i=>[0,2,6,8].includes(i)).length,edges=cells.length-corners;
      sections.push(['Kenali kes',`${algorithm.category}. ${corners} bucu${algorithm.group==='OLL'?` dan ${edges} tepi`:''} mempunyai warna U menghadap atas. Pusat U tidak dikira.`]);
      const facing=[...pieces.values()].filter(indices=>indices.length===3&&C.geometry(indices[0]).pos[1]===1).map(indices=>`${position(C.geometry(indices[0]).pos)} → ${C.faces[Math.floor(indices.find(i=>state[i]===upper)/9)]}`);
      sections.push(['Arah warna U pada bucu',facing.join(' · ')+'. Anak panah di sini menunjukkan muka yang menerima petak warna U, bukan arah pusingan.']);
    }else if(algorithm.group==='PLL')sections.push(['Kenali kes',`${algorithm.name} · ${algorithm.category}. Lihat keempat-empat sisi U, bukan muka atas sahaja. Padankan rajah dengan pusat sisi, kemudian bezakan arah kitaran dan kes bercermin.`]);
    else sections.push(['Bila digunakan','Formula ini ialah picu atau contoh latihan dalam pelajaran. Ia hanya memberi hasil yang ditunjukkan jika kedudukan mula sepadan; ia bukan formula untuk semua susunan kiub.']);
    sections.push(['Pegangan & persediaan',`${chosen.turn?`Rajah ini ialah kes asal selepas ${chosen.turn}. Buat ${chosen.setup} dahulu untuk kembali kepada pegangan formula asal. `:'Rajah menunjukkan pegangan formula asal; tiada pelarasan tambahan diperlukan untuk contoh ini. '}U di atas, F di depan, R di kanan. Seret rajah kiub untuk memeriksa sisi tersembunyi. Huruf merujuk muka, bukan warna tetap.`]);
    sections.push(['Cara lakukan','Baca dari kiri ke kanan dan lengkapkan keseluruhan urutan sekali. Tanda ′ bermaksud lawan jam apabila melihat terus muka itu; 2 bermaksud 180°. x/y/z memusing seluruh kiub; huruf kecil atau w memusing dua lapisan. Ikuti perubahan pegangan jika formula mengandunginya.']);
    if(group){sections.push(['Semak hasil',group.result]);sections.push(['Jika belum sepadan',group.avoid+' Cuba U, U′ atau U2 untuk padankan corak sebelum memilih formula; jangan tambah putaran di tengah urutan.']);}
    return {algorithm:chosen,state,sections};
  }
  return {profile,variant,groups};
});
