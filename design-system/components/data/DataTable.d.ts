import * as React from 'react';

/**
 * Plain data table: uppercase small headers, mono right-aligned numbers, row hover.
 */
export interface DataTableProps {
  columns: Array<{ key: string; label: string; numeric?: boolean; render?: (row: any) => React.ReactNode }>;
  rows: any[];
  caption?: string;
}

export declare function DataTable(props: DataTableProps): React.JSX.Element;
