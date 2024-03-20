import { Test } from '@nestjs/testing';
import { ExplorerService } from './explorer.service';
import { RpcHandler } from '../../../decorators';

@RpcHandler()
class TestClass {}

@RpcHandler()
class Test2Class {}

describe('explorer.service', () => {
  let explorerService: ExplorerService;
  beforeEach(async () => {
    const testModuleRef = await Test.createTestingModule({
      providers: [ExplorerService, TestClass, Test2Class],
    }).compile();
    explorerService = testModuleRef.get<ExplorerService>(ExplorerService);
  });

  it('explorer', async () => {
    const result = explorerService.explore();
    expect(result.length).toBe(2);
    expect(result).toContain(TestClass);
    expect(result).toContain(Test2Class);
  });
});
