import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
// Polyfill TextEncoder/Decoder for Firebase (ignore TS error, runtime works)
declare global {
  var TextEncoder: any;
  var TextDecoder: any;
}
if (typeof global !== 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// Firebase polyfill for crypto
import 'react-native-get-random-values';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
