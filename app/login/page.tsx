'use client';

import { useState } from 'react';
import { login } from '@/app/actions/auth';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-creme flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Titre */}
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-light italic text-brun tracking-wide">
            TBS Dashboard
          </h1>
          <p className="mt-2 text-sm text-brun/50 font-sans font-light tracking-wider uppercase">
            Gestion des commandes
          </p>
        </div>

        {/* Carte */}
        <div className="bg-white border border-creme-200 rounded-sm shadow-sm p-8">
          <h2 className="font-serif text-xl font-light text-brun mb-6">
            Connexion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-sans font-light tracking-widest uppercase text-brun/60 mb-2"
              >
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-creme border border-creme-200 rounded-sm text-brun placeholder-brun/30 font-sans font-light text-sm focus:outline-none focus:border-or focus:ring-1 focus:ring-or transition-colors"
                placeholder="vous@exemple.fr"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-sans font-light tracking-widest uppercase text-brun/60 mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-creme border border-creme-200 rounded-sm text-brun placeholder-brun/30 font-sans font-light text-sm focus:outline-none focus:border-or focus:ring-1 focus:ring-or transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-xs text-rouge font-sans">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brun text-creme font-sans font-light text-sm tracking-widest uppercase hover:bg-brun/90 disabled:opacity-50 transition-colors rounded-sm mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-brun/30 font-sans font-light">
          Acces reserve aux equipes autorisees
        </p>
      </div>
    </div>
  );
}
