import React from 'react';
import { Sparkles } from 'lucide-react';

export const RegenerateFullPageButton: React.FC = () => {
  return (
    <button
      type="button"
      style={{ backgroundColor: '#8E94F2' }}
      className="w-full px-4 py-3 border border-[#7a80e0] rounded-lg flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:bg-[#7a80e0] hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#8E94F2] focus:ring-offset-1"
    >
      <Sparkles size={20} className="text-white" />
      <span>Regenerate Full Page</span>
    </button>
  );
};

export default RegenerateFullPageButton;

