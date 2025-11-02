import { registerRootComponent } from 'expo';
import { registerPlatformConstraintsPolyfill } from './src/polyfills/registerPlatformConstraintsPolyfill';
import App from './App';

registerPlatformConstraintsPolyfill();

registerRootComponent(App);
