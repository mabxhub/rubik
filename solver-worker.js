importScripts('engine.js','tutorial-moves.js','staged-solver.js');
let libraryPromise;
onmessage = async ({data}) => {
  try {
    const state=data.state||data;
    const method=data.method||'auto';
    if(method!=='auto'&&!libraryPromise)libraryPromise=fetch('tutorial-algorithms.json').then(response=>{if(!response.ok)throw new Error('Pustaka formula tidak dapat dimuatkan.');return response.json();});
    const plan=solveByMethod(state,method,method==='auto'?[]:await libraryPromise);
    if(!methodFinished(methodApply(state,plan.moves)))throw new Error('Penyelesaian belum lengkap. Sila cuba lagi.');
    postMessage(plan);
  } catch (error) { postMessage({error:error.message}); }
};
