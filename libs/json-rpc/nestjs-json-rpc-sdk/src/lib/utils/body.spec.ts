import { generateBody, generateBodyMethod } from './body';
import { JSON_RPC_VERSION } from '../constans';

describe('body', () => {
  it('generateBodyMethod', () => {
    const nameSpace = 'nameSpace';
    const method = 'method';
    expect(generateBodyMethod(nameSpace, method)).toBe(
      `${nameSpace}.${method}`
    );
  });

  it('generateBody', () => {
    const nameSpace = 'nameSpace';
    const method = 'method';
    const params = ['param1', 'param2'];
    const id = 1;
    const result = generateBody(
      generateBodyMethod(nameSpace, method),
      params,
      id
    );
    expect(result).toEqual({
      jsonrpc: JSON_RPC_VERSION,
      method: generateBodyMethod(nameSpace, method),
      params,
      id,
    });
  });
});
