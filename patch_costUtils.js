const fs = require('fs');
let content = fs.readFileSync('src/lib/costUtils.ts', 'utf8');

// I will insert it after sewing.isActualAvailable = true; }
const replacement = `  if (!hasSewingBatches && order.batches && order.batches.length > 0) {
    sewing.actualTotal = 0;
    sewing.actualPerPiece = 0;
    sewing.isActualAvailable = true;
  }

  const isFinishingActualAvailable = hasFinishingBatches && !hasIncompleteActualFinishing;
  const finishing: CostComponent = {
    standardTotal: finishingStdTotal,
    standardPerPiece: order.standardFinishingCostPerPiece || 0,
    actualTotal: isFinishingActualAvailable ? finishingActualTotal : null,
    actualPerPiece: (isFinishingActualAvailable && finishingActualPieces > 0) ? (finishingActualTotal / finishingActualPieces) : null,
    isActualAvailable: isFinishingActualAvailable || (!hasFinishingBatches && order.batches && order.batches.length > 0)
  };

  if (!hasFinishingBatches && order.batches && order.batches.length > 0) {
    finishing.actualTotal = 0;
    finishing.actualPerPiece = 0;
    finishing.isActualAvailable = true;
  }`;

content = content.replace(/  if \(\!hasSewingBatches && order\.batches && order\.batches\.length > 0\) \{\n    sewing\.actualTotal = 0;\n    sewing\.actualPerPiece = 0;\n    sewing\.isActualAvailable = true;\n  \}/, replacement);

fs.writeFileSync('src/lib/costUtils.ts', content);
