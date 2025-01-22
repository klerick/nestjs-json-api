import { Bindings, excludeMethod } from './bindings';

describe('bindings', () => {
  it('excludeMethod', () => {
    expect(excludeMethod(['patchRelationship'])).toEqual(
      Object.keys(Bindings).filter((i) => i !== 'patchRelationship')
    );
  });
});
