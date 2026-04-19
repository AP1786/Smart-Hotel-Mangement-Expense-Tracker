const money = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

export function StateTables({ overview }) {
  if (!overview) {
    return null;
  }

  return (
    <div className="state-grid">
      <div className="table-shell">
        <h3>Ingredients</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Stock</th>
              <th>Unit Cost</th>
              <th>Threshold</th>
            </tr>
          </thead>
          <tbody>
            {overview.ingredients.map((ingredient) => (
              <tr key={ingredient.name}>
                <td>{ingredient.name}</td>
                <td>{ingredient.quantity_in_stock}</td>
                <td>{money.format(ingredient.price_per_unit)}</td>
                <td>{ingredient.threshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-shell">
        <h3>Dishes</h3>
        <table>
          <thead>
            <tr>
              <th>Dish</th>
              <th>Stock</th>
              <th>Cost</th>
              <th>Selling</th>
              <th>Sold</th>
            </tr>
          </thead>
          <tbody>
            {overview.dishes.map((dish) => (
              <tr key={dish.dish_id}>
                <td>{dish.dish_name}</td>
                <td>{dish.quantity_in_stock}</td>
                <td>{money.format(dish.cost_price)}</td>
                <td>{money.format(dish.selling_price)}</td>
                <td>{dish.total_sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-shell">
        <h3>Recent Sales</h3>
        <table>
          <thead>
            <tr>
              <th>Sale</th>
              <th>Dish</th>
              <th>Qty</th>
              <th>Revenue</th>
              <th>At</th>
            </tr>
          </thead>
          <tbody>
            {overview.recent_sales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>{sale.reference_id}</td>
                <td>{sale.dish_id}</td>
                <td>{sale.quantity}</td>
                <td>{money.format(sale.total_revenue)}</td>
                <td>{new Date(sale.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
