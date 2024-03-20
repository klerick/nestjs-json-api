import { idRequest } from './id-request';

describe('id-request', () => {
  it('should be increment', () => {
    expect(idRequest()).toBe(1);
    expect(idRequest()).toBe(2);
    expect(idRequest()).toBe(3);
  });
});
