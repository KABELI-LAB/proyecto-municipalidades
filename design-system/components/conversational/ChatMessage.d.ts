import * as React from 'react';

/**
 * One message in the Asistente Hualañé / WhatsApp thread: citizen, assistant, staff (funcionario) or system.
 */
export interface ChatMessageProps {
  from: 'citizen' | 'assistant' | 'staff' | 'system';
  children: React.ReactNode;
  time?: string;
  /** Sender name (staff) */
  name?: string;
  status?: 'sent' | 'read';
  /** Rich content under the bubble (cards, confirmations, files) */
  attachment?: React.ReactNode;
}

export declare function ChatMessage(props: ChatMessageProps): React.JSX.Element;
