export interface INotificationOptions {
  enabled: boolean;
  silent?: boolean;
}

export interface IPreferences {
  behaviour: {
    shouldUseDarkColors: string;
    language: string;
    preferredSystemLanguages?: string[];
    theme: Record<string, unknown>;
    notifications: INotificationOptions;
    sideBar: {
      visible: boolean;
      resizable: boolean;
      selected?: string;
    };
  };
  advanced: {
    isDev?: boolean;
    preferencesPath?: string;
    update: {
      automatic?: boolean;
    };
    logs: {
      enabled?: boolean;
      savePath?: string;
      backup?: {
        enabled: boolean;
        maxSize: number;
      };
      purge?: {
        enabled: boolean;
        maxSize: number;
      };
    };
  };
}
