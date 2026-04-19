export function Panel({ eyebrow, title, description, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
