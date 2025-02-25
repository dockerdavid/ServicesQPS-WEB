import 'pinia-plugin-persistedstate-2';

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean | {
      enabled?: boolean;
      strategies?: {
        key?: string;
        storage?: Storage;
      }[];
    };
  }
}