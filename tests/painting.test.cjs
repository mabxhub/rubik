const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function app(){
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{values:new Set(['hidden']),add(x){this.values.add(x)},remove(x){this.values.delete(x)},toggle(x,on){on?this.add(x):this.remove(x)}},setAttribute(){}});return elements.get(id);};
 const context=vm.createContext({THREE:require('../vendor/three.min.js'),window:{innerWidth:390,innerHeight:700,addEventListener(){}},document:{documentElement:{style:{setProperty(){}}},addEventListener(){},getElementById:element},setTimeout,clearTimeout});
 for(const file of ['engine.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 return {run:code=>vm.runInContext(code,context),element};
}
test('ninth colour dims silently; tenth sticker is rejected and warns',()=>{
 const a=app();a.run('selectedColor=1;for(let i=0;i<9;i++)paintSticker(i)');
 assert.equal(a.element('colorTile_1').classList.values.has('color-tile-full'),true);
 assert.equal(a.element('statusBanner').classList.values.has('hidden'),true);
 a.run('paintSticker(9)');assert.equal(a.run('facelets[9]'),3);assert.equal(a.run('getPaintCounts()[1]'),9);
 assert.equal(a.element('statusBanner').classList.values.has('hidden'),false);
 a.run('paintSticker(0)');assert.equal(a.run('getPaintCounts()[1]'),8);assert.equal(a.element('colorTile_1').classList.values.has('color-tile-full'),false);
});
test('remaining nine whites complete automatically without selecting white',()=>{
 const a=app();a.run('for(let face=0;face<6;face++){if(face===3)continue;selectedColor=face;for(let i=0;i<9;i++)paintSticker(face*9+i)}');
 assert.equal(a.run('paintedMask.every(Boolean)'),true);assert.equal(a.run('getPaintCounts()[3]'),9);
 assert.equal(a.run('faceletsToCubie(facelets).valid'),true);
 assert.equal(a.element('colorTile_3').classList.values.has('color-tile-full'),true);
});
test('explicit white is counted separately from blank white-looking stickers',()=>{
 const a=app();assert.equal(a.run('getPaintCounts()[3]'),0);
 a.run('selectedColor=3;for(let i=0;i<9;i++)paintSticker(i);paintSticker(10)');
 assert.equal(a.run('getPaintCounts()[3]'),9);assert.equal(a.run('paintedMask[10]'),false);
});
test('invalid arrangement warns only after Solve is pressed',async()=>{
 const a=app();a.run('facelets=cubieToFacelets(solvedCubie());paintedMask.fill(true);[facelets[5],facelets[10]]=[facelets[10],facelets[5]];syncStickers()');
 assert.equal(a.element('statusBanner').classList.values.has('hidden'),true);
 await a.run('startSolveProcess()');assert.equal(a.element('statusBanner').classList.values.has('hidden'),false);
});
