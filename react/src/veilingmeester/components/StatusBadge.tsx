import type { Status } from "../types";
import { statusBadgeVariant, statusLabel } from "../types";

/**
 * Badge component for statuswaarden met consistente kleurcodering.
 *
 * @param props - Statusinformatie om weer te geven.
 */
export function StatusBadge({ status }: { readonly status: Status }): JSX.Element {
    return <span className={`badge rounded-pill ${statusBadgeVariant(status)}`}>{statusLabel(status)}</span>;
}
