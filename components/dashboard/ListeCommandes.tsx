import type { Commande } from '@/lib/types';

type Props = {
  commandes: Commande[];
  commandeActive: Commande | null;
  onSelect: (c: Commande) => void;
};

const statutStyles: Record<string, string> = {
  en_attente: 'bg-or/10 text-or-dark border-or/20',
  acceptee: 'bg-brun/5 text-brun/70 border-brun/10',
  refusee: 'bg-rouge/10 text-rouge border-rouge/20',
};

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptee',
  refusee: 'Refusee',
};

function formatDate(str: string) {
  const d = new Date(str);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function ListeCommandes({ commandes, commandeActive, onSelect }: Props) {
  if (commandes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-serif text-xl font-light italic text-brun/40">
          Aucune commande
        </p>
        <p className="mt-2 text-xs font-sans font-light text-brun/30 tracking-wide">
          Les nouvelles commandes apparaitront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commandes.map(commande => (
        <button
          key={commande.id}
          onClick={() => onSelect(commande)}
          className={`w-full text-left bg-white border rounded-sm px-6 py-4 transition-all hover:shadow-sm ${
            commandeActive?.id === commande.id
              ? 'border-or ring-1 ring-or/20 shadow-sm'
              : 'border-creme-200 hover:border-brun/20'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-serif text-base font-light text-brun">
                  {commande.prenom} {commande.nom}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs border rounded-sm font-sans font-light tracking-wide ${statutStyles[commande.statut]}`}
                >
                  {statutLabels[commande.statut]}
                </span>
                {commande.acompte_envoye && (
                  <span className="inline-block px-2 py-0.5 text-xs border rounded-sm font-sans font-light tracking-wide bg-brun/5 text-brun/50 border-brun/10">
                    Acompte recu
                  </span>
                )}
              </div>
              <p className="text-sm font-sans font-light text-brun/60 truncate">
                {commande.type} &bull; {commande.personnes} personnes
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-sans font-light text-brun/40">
                {formatDate(commande.created_at)}
              </p>
              {commande.prix_total && (
                <p className="text-sm font-sans font-light text-brun mt-0.5">
                  {commande.prix_total.toFixed(2)} EUR
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
