import * as React from 'react';

/**
 * Citizen website header: gov strip + logo + needs-based nav + search/accessibility actions.
 */
export interface SiteHeaderProps {
  items?: Array<{ label: string; href?: string; current?: boolean }>;
  /** Path to assets/ folder for the logo */
  assetBase?: string;
  logoVariant?: 'citizen' | 'institutional';
  onSearch?: () => void;
  onAccessibility?: () => void;
  showGovStrip?: boolean;
}

export declare function SiteHeader(props: SiteHeaderProps): React.JSX.Element;
