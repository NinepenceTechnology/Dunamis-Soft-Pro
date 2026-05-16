import React from 'react';
import { Scissors } from 'lucide-react';

export const Background = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1] select-none">
      {/* Ícone de Tesoura Centralizado */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <Scissors 
          size={500} 
          strokeWidth={1.5} 
          className="text-primary/20 transform -rotate-12"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5" />
    </div>
  );
};
