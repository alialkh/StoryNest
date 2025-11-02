import { TurboModuleRegistry } from 'react-native';

type PlatformConstraintsConstants = {
  forceRTLIfSupported: boolean;
  isRTLAllowed: boolean;
  isRTLForced: boolean;
};

type PlatformConstraintsModule = {
  getConstants: () => PlatformConstraintsConstants;
};

let patched = false;

export const registerPlatformConstraintsPolyfill = () => {
  if (patched) {
    return;
  }

  patched = true;

  if (!TurboModuleRegistry?.getEnforcing) {
    return;
  }

  const originalGetEnforcing = TurboModuleRegistry.getEnforcing.bind(TurboModuleRegistry);

  TurboModuleRegistry.getEnforcing = (moduleName: string) => {
    if (moduleName !== 'PlatformConstraints') {
      return originalGetEnforcing(moduleName);
    }

    try {
      return originalGetEnforcing(moduleName);
    } catch (error) {
      const fallback: PlatformConstraintsModule = {
        getConstants: () => ({
          forceRTLIfSupported: false,
          isRTLAllowed: true,
          isRTLForced: false
        })
      };

      return fallback;
    }
  };
};
