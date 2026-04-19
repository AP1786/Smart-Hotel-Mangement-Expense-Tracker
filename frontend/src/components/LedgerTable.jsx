import { compactHash } from '@smart-hotel/shared';

export function LedgerTable({ blocks }) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr>
            <th>Height</th>
            <th>Action</th>
            <th>Reference</th>
            <th>Actor</th>
            <th>Hash</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block) => (
            <tr key={`${block.block_height}-${block.block_hash}`}>
              <td>#{block.block_height}</td>
              <td>{block.action_type}</td>
              <td>{block.reference_id}</td>
              <td>{block.actor}</td>
              <td className="mono">{compactHash(block.block_hash)}</td>
              <td>{new Date(block.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
