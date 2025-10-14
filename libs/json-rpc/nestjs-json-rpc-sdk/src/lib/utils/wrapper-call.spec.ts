import { WrapperCall } from './wrapper-call';
import { Transport } from '../types';
import { lastValueFrom, of } from 'rxjs';

function mockRPC(a: number, b: string): number {
  return 1;
}

describe('wrapper-call', () => {
  let nameSpace: string;
  let method: string;
  let arg: Parameters<typeof mockRPC>;
  let transport: Transport<typeof mockRPC>;

  beforeEach(() => {
    nameSpace = 'namespace';
    method = 'method';
    arg = [1, 'test'];
  });

  it('should be init Observable', async () => {
    const result = { result: 'result' };
    transport = vi.fn().mockImplementationOnce((input) => {
      return of(result);
    });
    expect.assertions(2);
    const instWrapperCall = new WrapperCall(nameSpace, method, arg, transport);
    const r = await lastValueFrom(instWrapperCall);
    expect(r).toEqual(result.result);
    expect(transport).toHaveBeenCalledWith(instWrapperCall.body);

  });
});
