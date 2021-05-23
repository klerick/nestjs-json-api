import { HttpAdapterHost } from '@nestjs/core';
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
    const connectionMock: Connection = {
      getRepository: jest.fn().mockReturnValue({
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

    const module = new JsonApiModule(connectionMock, adapterMock);
    module.onModuleInit();

    expect(getEntitiesMock).toBeCalled();
    expect(getConfigMock).toBeCalled();
    expect((adapterMock.httpAdapter.get as unknown as jest.Mock).mock.calls[0][0]).toBe('/example');
    expect((adapterMock.httpAdapter.use as unknown as jest.Mock).mock.calls[0][0]).toBe('/example');
  });

  it('should add resource configs', () => {
    const entitiesMock = [
      class FirstEntity {},
      class SecondEntity {},
    ];
    const addResourceConfigMock = (SwaggerService.addResourceConfig as unknown as jest.Mock);
    const getEntitiesMock = (SwaggerService.getEntities as unknown as jest.Mock).mockReturnValue(entitiesMock);
    const getConfigMock = (SwaggerService.getConfig as unknown as jest.Mock).mockReturnValue({
      prefix: 'example'
    });
    // @ts-ignore
    const connectionMock: Connection = {
      getRepository: jest.fn().mockReturnValue({
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

    const module = new JsonApiModule(connectionMock, adapterMock);
    module.onModuleInit();


    expect((connectionMock.getRepository as unknown as jest.Mock).mock.calls[0][0]).toBe(entitiesMock[0]);
    expect((connectionMock.getRepository as unknown as jest.Mock).mock.calls[1][0]).toBe(entitiesMock[1]);
    expect(connectionMock.getRepository).toBeCalledTimes(2);
    expect(addResourceConfigMock).toBeCalledTimes(2);
    expect(getEntitiesMock).toBeCalled();
  });
});
