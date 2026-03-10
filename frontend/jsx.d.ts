/// <reference types="react" />
/// <reference types="react-native" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

export {};
