import styles from './app.module.css';
import NxWelcome from './nx-welcome';
import "@angular/compiler";
import {init} from 'json-api-nestjs-sdk';

init()

export function App() {
  return (
    <>
      <NxWelcome title="example-client-react" />
      <div />
    </>
  );
}

export default App;
