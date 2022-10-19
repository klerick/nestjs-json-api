import styles from './app.module.css';
import NxWelcome from './nx-welcome';
import { getInstance, getInstancePromise } from 'json-api-nestjs-sdk';
import { BookList, Users, Roles, Comments, Addresses } from 'database/entity';

const service = getInstance(
  {
    apiPrefix: '/api/v1',
    apiHost: window.location.origin,
  },
  {
    BookList,
    Roles,
    Comments,
    Addresses,
    Users,
  }
);

const servicePromise = getInstancePromise();

export function App() {
  service
    .getOne<Users>(Users, 17, { include: ['addresses'] })
    .subscribe((r) => console.log(r));

  servicePromise
    .getOne<Users>(Users, 17, { include: ['addresses'] })
    .then((r) => console.log(r));
  return (
    <>
      <NxWelcome title="example-react-client" />
      <div />
    </>
  );
}

export default App;
