import styles from './app.module.css';
import NxWelcome from './nx-welcome';
import { getInstance } from 'json-api-nestjs-sdk';
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

export function App() {
  service.getOne<Users>(Users, 17).subscribe((r) => console.log(r));
  return (
    <>
      <NxWelcome title="example-react-client" />
      <div />
    </>
  );
}

export default App;
