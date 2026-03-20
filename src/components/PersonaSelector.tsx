import { User, Store, Ship, Leaf, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import React from 'react';

export type PersonaType = 'A' | 'B' | 'C' | 'D' | 'DEV';

interface Persona {
  id: PersonaType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const PERSONAS: Persona[] = [
  { id: 'A', title: 'A. Consommateur', description: 'Scanner classique avec redirection localisée.', icon: User },
  { id: 'B', title: 'B. POS (Caisse)', description: 'Extraction de lot/DLUO, test statut rappel.', icon: Store },
  { id: 'C', title: 'C. Douanes / Log.', description: 'Accès B2B restreint (traçabilité), token Bearer injecté.', icon: Ship },
  { id: 'D', title: 'D. Passeport Numérique', description: 'Certification produit et éco-score (DPP).', icon: Leaf },
  { id: 'DEV', title: 'Développeur', description: 'Inspection complète du Linkset JSON (linkType=all).', icon: Code },
];

interface Props {
  selected: PersonaType;
  onSelect: (id: PersonaType) => void;
}

export function PersonaSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {PERSONAS.map((persona) => {
        const Icon = persona.icon;
        const isSelected = selected === persona.id;
        
        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={cn(
              "relative flex flex-col items-start p-4 border rounded-xl transition-all duration-200 text-left",
              "hover:shadow-md",
              isSelected 
                ? "border-primary bg-[var(--color-primary)] text-white shadow-sm ring-1 ring-primary" 
                : "border-border bg-card hover:border-primary/50 text-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg mb-3 inline-flex",
               isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className={cn("font-semibold text-sm mb-1", isSelected ? "text-white" : "text-foreground")}>{persona.title}</h3>
            <p className={cn("text-xs leading-relaxed", isSelected ? "text-white/80" : "text-muted-foreground")}>
              {persona.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
