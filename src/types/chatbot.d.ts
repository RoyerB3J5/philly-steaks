// Declaraciones mínimas para el widget de LeadConnector/LC_API
declare global {
  interface LC_API_Static {
    open_chat?: () => void;
    toggle?: () => void;
    // añadir más métodos si se conocen
    [key: string]: any;
  }

  interface LeadconnectorStatic {
    open?: () => void;
    [key: string]: any;
  }

  interface Window {
    LC_API?: LC_API_Static;
    leadconnector?: LeadconnectorStatic;
  }
}

export {};
