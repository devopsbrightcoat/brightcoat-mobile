/**
 * @format
 */

// react-native-gesture-handler (lo usa el drawer/sidebar de navegación) debe
// importarse de primero, antes que cualquier otra cosa — incluyendo React.
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
