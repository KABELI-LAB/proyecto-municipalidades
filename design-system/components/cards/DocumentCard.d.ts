import * as React from 'react';

/**
 * Downloadable document row: type, title, size, date. Always say format and size before download.
 */
export interface DocumentCardProps {
  title: string;
  type?: 'PDF' | 'DOCX' | 'XLSX' | 'JPG';
  size?: string;
  date?: string;
  href?: string;
}

export declare function DocumentCard(props: DocumentCardProps): React.JSX.Element;
