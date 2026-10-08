import * as React from 'react';

/**
 * Message composer with attach (documents), location and voice input — voice is first-class.
 */
export interface ChatComposerProps {
  placeholder?: string;
  onSend?: (text: string) => void;
  onAttach?: () => void;
  onLocation?: () => void;
  onVoice?: () => void;
  listening?: boolean;
}

export declare function ChatComposer(props: ChatComposerProps): React.JSX.Element;
