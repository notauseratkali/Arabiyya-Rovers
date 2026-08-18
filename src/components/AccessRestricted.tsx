import React from 'react';
import { ShieldAlert, Compass, ArrowLeft } from 'lucide-react';

interface AccessRestrictedProps {
  sectionName: string;
  onGoBack: () => void;
  memberName: string;
  memberRole: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  sectionName,
  onGoBack,
  memberName,
  memberRole,
}) => {
  const formattedSectionName = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#800020]" />
        
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#800020]">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Access Restricted Section
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            You do not have the required council permissions to access the <strong className="text-slate-800 font-semibold">{formattedSectionName}</strong> portal page.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Logged in as:</span>
            <span className="text-slate-800 font-bold">{memberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Designation:</span>
            <span className="text-slate-800 font-medium">{memberRole}</span>
          </div>
          <div className="flex justify-between pt-1.5 border-t border-slate-200/60">
            <span className="text-slate-400 font-medium">Required Authorization:</span>
            <span className="text-[#800020] font-bold">Rover Advisor / Admin Approved</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          If you require access, please contact your Rover Advisor or the Crew Administrator to update your portal permissions.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
