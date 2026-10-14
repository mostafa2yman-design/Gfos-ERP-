import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface PrintInstructionsProps {
  title?: string;
  instructions?: string | string[];
  notes?: string;
  type?: 'general' | 'warning' | 'quality';
}

export const PrintInstructions: React.FC<PrintInstructionsProps> = ({
  title = "تعليمات التشغيل والملاحظات الفنية للمرحلة",
  instructions,
  notes,
  type = 'general'
}) => {
  const contentList: string[] = [];
  
  if (Array.isArray(instructions)) {
    contentList.push(...instructions.filter(Boolean));
  } else if (typeof instructions === 'string' && instructions.trim()) {
    // Split by newlines if multi-line
    const lines = instructions.split('\n').map(l => l.trim()).filter(Boolean);
    contentList.push(...lines);
  }

  if (notes && notes.trim() && !contentList.includes(notes.trim())) {
    contentList.push(`ملاحظة: ${notes.trim()}`);
  }

  const borderClass = type === 'warning' 
    ? 'border-amber-400 bg-amber-50/40' 
    : type === 'quality' 
      ? 'border-indigo-400 bg-indigo-50/40' 
      : 'border-slate-300 bg-slate-50';

  return (
    <div className={`gfos-print-instructions rounded border p-2.5 mb-3 break-inside-avoid ${borderClass}`}>
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-1.5">
        <Info className="w-3.5 h-3.5 text-slate-700" />
        <h4 className="font-bold text-[10.5px] text-slate-900">{title}</h4>
      </div>

      {contentList.length > 0 ? (
        <ul className="space-y-1 text-[9.5px] text-slate-800 pr-4 list-disc list-outside leading-relaxed">
          {contentList.map((item, idx) => (
            <li key={idx} className="whitespace-pre-wrap">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[9.5px] text-slate-500 italic pr-1">
          الالتزام بالمواصفات الفنية القياسية للمصنع وتعليمات الجودة المعتمدة.
        </p>
      )}
    </div>
  );
};
