'use client';

import { useState } from 'react';
import type { Commande } from '@/lib/types';
import {
  accepterCommande,
  refuserCommande,
  toggleAcompteRecu,
} from '@/app/actions/commandes';

type Props = {
  commande: Commande;
  onClose: () => void;
  onUpdate: (updated: Commande) => void;
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function PanelDetail({ commande, onClose, onUpdate }: Props) {
  const [prixInput, setPrixInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccepterForm, setShowAccepterForm] = useState(false);

  async function handleAccepter() {
    const prix = parseFloat(prixInput.replace(',', '.'));
    if (isNaN(prix) || prix <= 0) {
      setError('Prix invalide.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await accepterCommande(commande.id, prix);

    if (result.error) {
      setError(result.error);
    } else {
      onUpdate({ ...commande, statut: 'acceptee', prix_total: prix });
      setShowAccepterForm(false);
    }
    setLoading(false);
  }

  async function handleRefuser() {
    if (!confirm('Confirmer le refus de cette commande ?')) return;
    setLoading(true);
    setError(null);
    const result = await refuserCommande(commande.id);
    if (result.error) {
      setError(result.error);
    } else {
      onUpdate({ ...commande, statut: 'refusee' });
    }
    setLoading(false);
  }

  async function handleToggleAcompte() {
    setLoading(true);
    setError(null);
    const result = await toggleAcompteRecu(commande.id, commande.acompte_envoye);
    if (result.error) {
      setError(result.error);
    } else {
      onUpdate({ ...commande, acompte_envoye: !commande.acompte_envoye });
    }
    setLoading(false);
  }

  const acompte = commande.prix_total ? commande.prix_total * 0.3 : null;

  return (
    <aside className="w-96 flex-shrink-0 bg-white border-l border-creme-200 flex flex-col overflow-hidden">
      {/* En-tete */}
      <div className="px-6 py-5 border-b border-creme-200 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl font-light italic text-brun">
            {commande.prenom} {commande.nom}
          </h2>
          <p className="text-xs font-sans font-light text-brun/40 mt-0.5 tracking-wide">
            Commande du {formatDate(commande.created_at)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-brun/30 hover:text-brun transition-colors p-1"
          aria-label="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Section commande */}
        <Section titre="Commande">
          <Champ label="Type" valeur={commande.type} />
          <Champ label="Date evenement" valeur={commande.date_evenement} />
          <Champ label="Personnes" valeur={commande.personnes} />
          <Champ label="Description" valeur={commande.description} multiline />
          {commande.allergies && (
            <Champ label="Allergies" valeur={commande.allergies} />
          )}
        </Section>

        {/* Section client */}
        <Section titre="Client">
          <Champ label="Telephone" valeur={commande.telephone} />
          <Champ label="Email" valeur={commande.email} />
        </Section>

        {/* Section financiere */}
        {commande.prix_total && (
          <Section titre="Finances">
            <Champ
              label="Prix total"
              valeur={`${commande.prix_total.toFixed(2)} EUR`}
            />
            {acompte && (
              <Champ
                label="Acompte (30%)"
                valeur={`${acompte.toFixed(2)} EUR`}
                accent
              />
            )}
            <Champ
              label="Acompte recu"
              valeur={commande.acompte_envoye ? 'Oui' : 'Non'}
            />
          </Section>
        )}

        {/* Formulaire acceptation */}
        {showAccepterForm && (
          <div className="border border-or/30 bg-or/5 rounded-sm p-4">
            <p className="text-xs font-sans font-light tracking-widest uppercase text-brun/60 mb-3">
              Prix total (EUR)
            </p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={prixInput}
              onChange={e => setPrixInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 bg-white border border-creme-200 rounded-sm text-brun font-sans font-light text-sm focus:outline-none focus:border-or focus:ring-1 focus:ring-or"
            />
            {prixInput && !isNaN(parseFloat(prixInput.replace(',', '.'))) && (
              <p className="mt-2 text-xs font-sans font-light text-brun/60">
                Acompte : {(parseFloat(prixInput.replace(',', '.')) * 0.3).toFixed(2)} EUR
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccepter}
                disabled={loading}
                className="flex-1 py-2 text-xs font-sans font-light tracking-widest uppercase bg-brun text-creme rounded-sm hover:bg-brun/90 disabled:opacity-50 transition-colors"
              >
                {loading ? '...' : 'Confirmer'}
              </button>
              <button
                onClick={() => { setShowAccepterForm(false); setError(null); }}
                className="flex-1 py-2 text-xs font-sans font-light tracking-widest uppercase bg-creme border border-creme-200 text-brun/60 rounded-sm hover:border-brun/20 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-rouge font-sans">{error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-5 border-t border-creme-200 space-y-2">
        {commande.statut === 'en_attente' && !showAccepterForm && (
          <>
            <button
              onClick={() => setShowAccepterForm(true)}
              disabled={loading}
              className="w-full py-2.5 text-xs font-sans font-light tracking-widest uppercase bg-brun text-creme rounded-sm hover:bg-brun/90 disabled:opacity-50 transition-colors"
            >
              Accepter
            </button>
            <button
              onClick={handleRefuser}
              disabled={loading}
              className="w-full py-2.5 text-xs font-sans font-light tracking-widest uppercase bg-rouge/10 text-rouge border border-rouge/20 rounded-sm hover:bg-rouge/20 disabled:opacity-50 transition-colors"
            >
              Refuser
            </button>
          </>
        )}

        {commande.statut === 'acceptee' && (
          <button
            onClick={handleToggleAcompte}
            disabled={loading}
            className={`w-full py-2.5 text-xs font-sans font-light tracking-widest uppercase rounded-sm border transition-colors disabled:opacity-50 ${
              commande.acompte_envoye
                ? 'bg-brun/5 text-brun/50 border-brun/10 hover:bg-rouge/10 hover:text-rouge hover:border-rouge/20'
                : 'bg-or/10 text-or-dark border-or/30 hover:bg-or/20'
            }`}
          >
            {loading ? '...' : commande.acompte_envoye ? 'Annuler acompte recu' : 'Acompte recu'}
          </button>
        )}

        {commande.statut === 'refusee' && (
          <p className="text-center text-xs font-sans font-light text-brun/30 py-2">
            Cette commande a ete refusee
          </p>
        )}
      </div>
    </aside>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-sans font-light tracking-widest uppercase text-brun/40 mb-3 pb-2 border-b border-creme-200">
        {titre}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Champ({
  label,
  valeur,
  multiline,
  accent,
}: {
  label: string;
  valeur: string;
  multiline?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-sans font-light text-brun/40 mb-0.5">{label}</p>
      <p
        className={`text-sm font-sans font-light ${
          accent ? 'text-rouge font-normal' : 'text-brun'
        } ${multiline ? 'leading-relaxed' : ''}`}
      >
        {valeur}
      </p>
    </div>
  );
}
