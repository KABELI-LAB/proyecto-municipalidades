import * as React from 'react';

/**
 * Drop zone + file list for trámite documents; always state accepted formats and max size.
 */
export interface FileUploadProps {
  label: string;
  hint?: string;
  files?: Array<{ name: string; size?: string; status?: 'uploading' | 'done' | 'error' }>;
  onRemove?: (name: string) => void;
}

export declare function FileUpload(props: FileUploadProps): React.JSX.Element;
