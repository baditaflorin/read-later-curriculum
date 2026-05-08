/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __COMMIT_SHA__: string;
declare const __BUILT_AT__: string;

interface BrowserLanguageModel {
  prompt(input: string): Promise<string>;
  destroy?: () => void;
}

interface BrowserLanguageModelFactory {
  availability?: () => Promise<string>;
  create: (options?: {
    systemPrompt?: string;
  }) => Promise<BrowserLanguageModel>;
}

interface Window {
  ai?: {
    languageModel?: BrowserLanguageModelFactory;
  };
  LanguageModel?: BrowserLanguageModelFactory;
}
