'use client';

import { logout } from '@/app/actions/auth';

type Props = {
  tenantName: string;
  userEmail: string;
};

export default function Header({ tenantName, userEmail }: Props) {
  return (
    <header className="bg-brun text-creme px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="font-serif text-2xl font-light italic tracking-wide">
          {tenantName}
        </h1>
        <p className="text-xs font-sans font-light text-creme/40 tracking-widest uppercase mt-0.5">
          Gestion des commandes
        </p>
      </div>

      <div className="flex items-center gap-6">
        <span className="text-xs font-sans font-light text-creme/50">
          {userEmail}
        </span>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs font-sans font-light tracking-widest uppercase text-creme/60 hover:text-or transition-colors"
          >
            Deconnexion
          </button>
        </form>
      </div>
    </header>
  );
}
