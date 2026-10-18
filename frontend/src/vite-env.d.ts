/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ALLOW_DEMO_LOGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
