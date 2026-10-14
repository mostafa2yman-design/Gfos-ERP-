const fs = require('fs');
let content = fs.readFileSync('src/lib/productionOrderCommands.ts', 'utf8');
content = content.replace(/saveProductionOrder/g, 'persistOrder');
content = content.replace(/export async function approveBatchFinishing/, "import { OrderStatus } from '../types';\nexport async function approveBatchFinishing");
fs.writeFileSync('src/lib/productionOrderCommands.ts', content);
