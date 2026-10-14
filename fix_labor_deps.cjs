const fs = require('fs');
let content = fs.readFileSync('src/components/accounting/LaborList.tsx', 'utf8');

content = content.replace("setGroups(getOperationalGroups());\\n    setDepartments(getDepartments());", "setGroups(getOperationalGroups());\n    setDepartments(getDepartments());");

fs.writeFileSync('src/components/accounting/LaborList.tsx', content);
