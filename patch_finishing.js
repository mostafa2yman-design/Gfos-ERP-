const fs = require('fs');
let content = fs.readFileSync('src/components/FinishingForm.tsx', 'utf8');

content = content.replace(/const approveResult = await Cmd\.approveBatchFinishing\(updatedOrder, batchId\);/, 'const approveResult = await Cmd.approveBatchFinishing(savedResult.data!, batchId);');

content = content.replace(/const updatedOrder = { ...order, batches };\n        await Cmd\.saveFinishingData\(order, batches\);\n        const approveResult = await Cmd\.approveAllFinishing\(updatedOrder\);/, `const saveResult = await Cmd.saveFinishingData(order, batches);\n        if (!saveResult.success || !saveResult.data) { setToastConfig({ message: saveResult.error || "خطأ", type: "error" }); return; }\n        const approveResult = await Cmd.approveAllFinishing(saveResult.data);`);

fs.writeFileSync('src/components/FinishingForm.tsx', content);
