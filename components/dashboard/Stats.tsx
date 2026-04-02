type Props = {
  stats: {
    en_attente: number;
    acceptees: number;
    refusees: number;
  };
};

export default function Stats({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        label="En attente"
        value={stats.en_attente}
        accent="text-or"
        border="border-or/30"
      />
      <StatCard
        label="Acceptees"
        value={stats.acceptees}
        accent="text-brun"
        border="border-brun/20"
      />
      <StatCard
        label="Refusees"
        value={stats.refusees}
        accent="text-rouge"
        border="border-rouge/30"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  border,
}: {
  label: string;
  value: number;
  accent: string;
  border: string;
}) {
  return (
    <div className={`bg-creme border ${border} rounded-sm px-5 py-4`}>
      <p className="text-xs font-sans font-light tracking-widest uppercase text-brun/50 mb-1">
        {label}
      </p>
      <p className={`font-serif text-3xl font-light ${accent}`}>{value}</p>
    </div>
  );
}
