import { HttpAdapterHost, ModuleRef } from '@nestjs/core';
import { Connection } from 'typeorm';

import { SwaggerService } from './services/swagger/swagger.service';
import { JsonApiModule } from './json-api.module';

jest.mock('./services/swagger/swagger.service');


describe('JsonAPIModule', () => {
  it('should init swagger route', () => {
    const getEntitiesMock = (SwaggerService.getEntities as unknown as jest.Mock).mockReturnValue([]);
    const getConfigMock = (SwaggerService.getConfig as unknown as jest.Mock).mockReturnValue({
      prefix: 'example'
    });
    // @ts-ignore
    const moduleRefMock: ModuleRef = {
      get: jest.fn().mockReturnValue({
        metadata: {}
      })
    };
    const adapterMock: HttpAdapterHost = {
      // @ts-ignore
      httpAdapter: {
        get: jest.fn(),
        use: jest.fn(),
      }
    };

    const module = new JsonApiModule(moduleRefMock, adapterMock);
    module.onModuleInit();

    expect(getEntitiesMock).toBeCalled();
    expect(getConfigMock).toBeCalled();
    expect((adapterMock.httpAdapter.get as unknown as jest.Mock).mock.calls[0][0]).toBe('/example');
    expect((adapterMock.httpAdapter.use as unknown as jest.Mock).mock.calls[0][0]).toBe('/example');
  });

  it('should add resource configs', () => {
    const entitiesMock = [
      class FirstEntity {
      },
      class SecondEntity {
      },
    ];
    const addResourceConfigMock = (SwaggerService.addResourceConfig as unknown as jest.Mock);
    const getEntitiesMock = (SwaggerService.getEntities as unknown as jest.Mock).mockReturnValue(entitiesMock);
    const getConfigMock = (SwaggerService.getConfig as unknown as jest.Mock).mockReturnValue({
      prefix: 'example'
    });
    // @ts-ignore
    const moduleRefMock: ModuleRef = {
      get: jest.fn().mockReturnValue({
        metadata: {}
      })
    };
    const adapterMock: HttpAdapterHost = {
      // @ts-ignore
      httpAdapter: {
        get: jest.fn(),
        use: jest.fn(),
      }
    };

    const mockConnectionName = 'mockConnectionName';
    // @ts-ignore
    JsonApiModule.connectionName = mockConnectionName;
    const module = new JsonApiModule(moduleRefMock, adapterMock);
    module.onModuleInit();

    expect((moduleRefMock.get as unknown as jest.Mock).mock.calls[0][0]).toBe(`${mockConnectionName}_${entitiesMock[0].name}Repository`);
    expect((moduleRefMock.get as unknown as jest.Mock).mock.calls[1][0]).toBe(`${mockConnectionName}_${entitiesMock[1].name}Repository`);
    expect(moduleRefMock.get).toBeCalledTimes(2);
    expect(addResourceConfigMock).toBeCalledTimes(2);
    expect(getEntitiesMock).toBeCalled();
  });
});
