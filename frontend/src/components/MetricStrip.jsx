const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

export function MetricStrip({ overview, evmStatus }) {
  if (!overview) {
    return null;
  }

  const cards = [
    { label: 'Ingredients', value: overview.metrics.ingredient_count },
    { label: 'Dishes', value: overview.metrics.dish_count },
    { label: 'Sales', value: overview.metrics.sales_count },
    { label: 'Revenue', value: money.format(overview.metrics.total_revenue) },
    { label: 'Profit', value: money.format(overview.metrics.total_profit) },
    { label: 'Latest Block', value: `#${overview.metrics.latest_block_height}` },
  ];

  return (
    <div className="metric-grid">
      {cards.map((card) => (
        <article key={card.label} className="metric-card">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
      <article className="metric-card metric-card-accent">
        <span>On-Chain Mirror</span>
        <strong>{evmStatus?.enabled ? evmStatus.networkName : 'Disabled'}</strong>
        <small>
          {evmStatus?.enabled
            ? `${evmStatus.mirroredActionCount} actions mirrored`
            : evmStatus?.reason}
        </small>
      </article>
    </div>
  );
}
