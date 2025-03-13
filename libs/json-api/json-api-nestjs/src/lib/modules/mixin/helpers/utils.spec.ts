import { getEntityName } from '@klerick/json-api-nestjs-shared';

import { nameIt, excludeMethod, getProviderName } from './utils';
import { Bindings } from '../config/bindings';
import { JSON_API_CONTROLLER_POSTFIX } from '../../../constants';

describe('Test utils', () => {
  it('nameIt', () => {
    const newNameClass = 'newNameClass';
    const newClass = nameIt(newNameClass, class {});
    expect(getEntityName(newClass)).toBe(newNameClass);
  });

  it('excludeMethod', () => {
    expect(excludeMethod(['patchRelationship'])).toEqual(
      Object.keys(Bindings).filter((i) => i !== 'patchRelationship')
    );
  });

  it('getProviderName', () => {
    class BookList {}
    expect(getProviderName(BookList, JSON_API_CONTROLLER_POSTFIX)).toEqual(
      'BookList' + JSON_API_CONTROLLER_POSTFIX
    );
  });
});
