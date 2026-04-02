'use client';

import { useState } from 'react';
import type { Commande, Statut } from '@/lib/types';
import Header from '@/components/dashboard/Header';
import Stats from '@/components/dashboard/Stats';
import FiltreStatut from '@/components/dashboard/FiltreStatut';
import ListeCommandes from '@/components/dashboard/ListeCommandes';
import PanelDetail from '@/components/dashboard/PanelDetail';

type Props = {
  commandes: Commande[];
  tenantName: string;
  userEmail: string;
};

export default function DashboardClient({ commandes, tenantName, userEmail }: Props) {
  const [filtre, setFiltre] = useState<Statut | 'toutes'>('toutes');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<Commande | null>(null);
  const [commandesState, setCommandesState] = useState<Commande[]>(commandes);

  const commandesFiltrees = filtre === 'toutes'
    ? commandesState
    : commandesState.filter(c => c.statut === filtre);

  const stats = {
    en_attente: commandesState.filter(c => c.statut === 'en_attente').length,
    acceptees: commandesState.filter(c => c.statut === 'acceptee').length,
    refusees: commandesState.filter(c => c.statut === 'refusee').length,
  };

  function handleCommandeUpdate(updated: Commande) {
    setCommandesState(prev =>
      prev.map(c => c.id === updated.id ? updated : c)
    );
    setCommandeSelectionnee(updated);
  }

  return (
    <div className="min-h-screen bg-creme flex flex-col">
      <Header tenantName={tenantName} userEmail={userEmail} />

      <main className="flex-1 flex overflow-hidden">
        {/* Colonne gauche */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-creme-200 bg-white">
            <Stats stats={stats} />
            <div className="mt-5">
              <FiltreStatut filtre={filtre} onFiltre={setFiltre} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <ListeCommandes
              commandes={commandesFiltrees}
              commandeActive={commandeSelectionnee}
              onSelect={setCommandeSelectionnee}
            />
          </div>
        </div>

        {/* Panel detail */}
        {commandeSelectionnee && (
          <PanelDetail
            commande={commandeSelectionnee}
            onClose={() => setCommandeSelectionnee(null)}
            onUpdate={handleCommandeUpdate}
          />
        )}
      </main>
    </div>
  );
}
