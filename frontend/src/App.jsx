import { Panel } from './components/Panel';
import { LedgerTable } from './components/LedgerTable';
import { MetricStrip } from './components/MetricStrip';
import { DishForm, RestockForm, SaleForm } from './components/TransactionForms';
import { StateTables } from './components/StateTables';
import { useDashboardData } from './hooks/use-dashboard-data';

function App() {
  const {
    snapshot,
    loading,
    error,
    activity,
    refresh,
    restockIngredient,
    registerDish,
    recordSale,
  } = useDashboardData();

  return (
    <div className="app-shell">
      <div className="hero-glow hero-glow-left" />
      <div className="hero-glow hero-glow-right" />

      <header className="hero">
        <div>
          <span className="hero-kicker">Hybrid Hotel dApp</span>
          <h1>
            Run hotel operations with an off-chain Python ledger and an on-chain EVM audit mirror.
          </h1>
          <p>
            Restock ingredients, register dishes, record sales, and inspect the immutable block
            trail without juggling three different operator consoles.
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={() => void refresh()}>
          Refresh Snapshot
        </button>
      </header>

      {loading ? <div className="status-banner">Loading dashboard snapshot...</div> : null}
      {error ? <div className="status-banner status-banner-error">{error}</div> : null}
      {activity ? (
        <div className={`status-banner status-banner-${activity.type}`}>{activity.message}</div>
      ) : null}

      <MetricStrip overview={snapshot.overview} evmStatus={snapshot.evmStatus} />

      <section className="command-grid">
        <Panel
          eyebrow="Inventory"
          title="Restock Ingredient"
          description="Update weighted ingredient cost and append a new off-chain block."
        >
          <RestockForm onSubmit={restockIngredient} />
        </Panel>

        <Panel
          eyebrow="Kitchen"
          title="Register Dish"
          description="Create a sellable dish, reserve ingredient stock, and mirror the valuation rules."
        >
          <DishForm onSubmit={registerDish} />
        </Panel>

        <Panel
          eyebrow="Sales"
          title="Record Dish Sale"
          description="Move dish inventory, recognize revenue, and create a synchronized ledger event."
        >
          <SaleForm onSubmit={recordSale} />
        </Panel>
      </section>

      <Panel
        eyebrow="Operations"
        title="Current State"
        description="A live view of ingredient inventory, dish stock, and the recent sales stream."
      >
        <StateTables overview={snapshot.overview} />
      </Panel>

      <Panel
        eyebrow="Ledger"
        title="Block Timeline"
        description="Each accepted hotel action is chained to the previous block with a deterministic hash."
      >
        <LedgerTable blocks={snapshot.blocks} />
      </Panel>
    </div>
  );
}

export default App;
