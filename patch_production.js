const fs = require('fs');
let content = fs.readFileSync('src/components/ProductionOrderForm.tsx', 'utf8');

content = content.replace(
  /finalValue = value === '' \? undefined : parseFloat\(value\);/,
  "const parsed = parseFloat(value); finalValue = isNaN(parsed) ? undefined : parsed;"
);

fs.writeFileSync('src/components/ProductionOrderForm.tsx', content);
