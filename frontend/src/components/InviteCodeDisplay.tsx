'use client';
import { toast } from 'sonner';

export function InviteCodeDisplay({ code }: { code: string }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success('¡Código copiado!');
  };

  return (
    <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-5 animate-slide-up">
      <p className="text-sm font-medium text-primary-400 mb-2">Código de invitación</p>
      <div className="flex items-center gap-3">
        <code className="text-xl font-bold text-primary-300 tracking-[0.2em] font-mono">{code}</code>
        <button
          onClick={copyToClipboard}
          className="text-primary-400 hover:text-primary-300 transition-colors p-1.5 rounded-lg hover:bg-primary-500/10"
          title="Copiar código"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-primary-400/60 mt-2">Comparte este código con quien quieras invitar al grupo</p>
    </div>
  );
}
