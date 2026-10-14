function getRealStage(batch) {
  const needsPrintEmb = batch.executionType && batch.executionType !== "بدون طباعة / تطريز";

  // Check from the end backwards to find the actual furthest progress
  
  if (batch.ironingData?.status === 'مكتمل') {
    return 'done'; // Completed all
  }
  
  if (batch.ironingData?.status === 'جاري') {
    return { stage: 'ironing', details: 'جاري المكواة' };
  }
  
  if (batch.finishingData?.status === 'مكتمل') {
    return { stage: 'ironing', details: 'بانتظار المكواة' };
  }
  
  if (batch.finishingData?.status === 'جاري') {
    return { stage: 'finishing', details: 'جاري التشطيب' };
  }
  
  if (batch.sewingData?.status === 'مكتمل') {
    return { stage: 'finishing', details: 'بانتظار التشطيب' };
  }
  
  if (batch.sewingData?.status === 'جاري') {
    return { stage: 'sewing', details: batch.sewingData?.manufacturingType || 'جاري الخياطة' };
  }
  
  if (needsPrintEmb) {
    if (batch.printEmbroideryStatus === 'مكتمل' || batch.printEmbroideryStatus === 'تم التخطي') {
      return { stage: 'sewing', details: 'بانتظار الخياطة' };
    }
    if (batch.printEmbroideryStatus === 'في المطبعة / التطريز') {
      return { stage: 'printEmb', details: batch.executionType || 'جاري الطباعة/التطريز' };
    }
    if (batch.prepStatus === 'مكتمل') {
      return { stage: 'printEmb', details: 'بانتظار الطباعة' };
    }
  } else {
    if (batch.prepStatus === 'مكتمل') {
      return { stage: 'sewing', details: 'بانتظار الخياطة' };
    }
  }
  
  if (batch.prepStatus === 'جاري' || !batch.prepStatus) {
    return { stage: 'preparation', details: 'جاري التجهيز' };
  }

  // Fallback
  return { stage: 'preparation', details: 'جاري التجهيز' };
}
console.log("Logic is syntactically sound");
