import type { PropsWithChildren, ReactNode } from "react";

export type TableColumn<T> = {
    header: string;
    render: (row: T) => ReactNode;
};

export function Table<T>({ columns, rows, emptyLabel }: PropsWithChildren<{ columns: TableColumn<T>[]; rows: T[]; emptyLabel?: string }>) {
    return (
        <div className="table-responsive">
            <table className="table table-striped align-middle mb-0">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="text-center text-muted">
                                {emptyLabel ?? "Geen resultaten"}
                            </td>
                        </tr>
                    )}
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {columns.map((col, colIndex) => (
                                <td key={colIndex}>{col.render(row)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
