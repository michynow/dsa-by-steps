import type en from './messages/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'app';
    resources: { app: typeof en };
    returnNull: false;
  }
}
