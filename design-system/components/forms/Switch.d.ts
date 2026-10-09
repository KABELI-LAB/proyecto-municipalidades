import * as React from 'react';

/**
 * On/off toggle for immediate settings (notifications, high contrast); not for form submission.
 */
export interface SwitchProps {
  label: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: any) => void;
}

export declare function Switch(props: SwitchProps): React.JSX.Element;
