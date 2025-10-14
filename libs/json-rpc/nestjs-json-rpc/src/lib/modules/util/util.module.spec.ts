import { Test } from '@nestjs/testing';
import { UtilModule } from './util.module';
import { ExplorerService } from './service';
import { MAP_HANDLER } from '../../constants';

class TestClass {}
class Test2Class {}

describe('Check util module', () => {
  let utilModule: UtilModule;
  let explorerService: ExplorerService;
  let mapHandler: Map<string, unknown>;
  beforeEach(async () => {
    const testModuleRef = await Test.createTestingModule({
      imports: [UtilModule],
      providers: [TestClass, Test2Class],
    }).compile();

    explorerService = testModuleRef.get(ExplorerService);
    utilModule = testModuleRef.get(UtilModule);
    mapHandler = testModuleRef.get(MAP_HANDLER);
  });

  it('onApplicationBootstrap', async () => {
    vi
      .spyOn(explorerService, 'explore')
      .mockReturnValue([TestClass, Test2Class]);
    utilModule.onApplicationBootstrap();
    expect(mapHandler.size).toBe(2);
    expect(mapHandler.get(TestClass.name)).toBeInstanceOf(TestClass);
    expect(mapHandler.get(Test2Class.name)).toBeInstanceOf(Test2Class);
  });
});
