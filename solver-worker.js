importScripts('engine.js');
onmessage = ({data}) => {
  try {
    const moves = solveCubeState(data);
    let result = data;
    for (const move of moves) result = multiplyCubie(result, ALL_MOVES[move]);
    if (JSON.stringify(result) !== JSON.stringify(solvedCubie())) throw new Error('Penyelesaian belum lengkap. Sila cuba lagi.');
    postMessage({moves});
  } catch (error) { postMessage({error: error.message}); }
};
