// cutOptimizer.js
function optimizeCuts(cuts, stockLengths) {
  const result = [];
  const waste = [];

  // Sort cuts (longest first)
  const sortedCuts = [...cuts].sort((a, b) => b - a);
  const stock = [...stockLengths].map((len, i) => ({
    id: i + 1,
    original: len,
    remaining: len,
    cuts: [],
  }));

  for (const cut of sortedCuts) {
    let placed = false;

    for (const piece of stock) {
      if (piece.remaining >= cut) {
        piece.cuts.push(cut);
        piece.remaining -= cut;
        placed = true;
        break;
      }
    }

    if (!placed) {
      waste.push(cut); // Could not place this cut
    }
  }

  return { stock, waste };
}

module.exports = optimizeCuts;
