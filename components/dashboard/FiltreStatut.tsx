import type { Statut } from '@/lib/types';

type Filtre = Statut | 'toutes';

type Props = {
  filtre: Filtre;
  onFiltre: (f: Filtre) => void;
};

const filtres: { value: Filtre; label: string }[] = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'acceptee', label: 'Acceptees' },
  { value: 'refusee', label: 'Refusees' },
];

export default function FiltreStatut({ filtre, onFiltre }: Props) {
  return (
    <div className="flex gap-1">
      {filtres.map(f => (
        <button
          key={f.value}
          onClick={() => onFiltre(f.value)}
          className={`px-4 py-1.5 text-xs font-sans font-light tracking-widest uppercase rounded-sm transition-colors ${
            filtre === f.value
              ? 'bg-brun text-creme'
              : 'bg-creme-200 text-brun/60 hover:bg-creme-100 hover:text-brun'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
