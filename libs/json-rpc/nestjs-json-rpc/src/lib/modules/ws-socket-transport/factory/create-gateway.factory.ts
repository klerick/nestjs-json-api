import { WebSocketGatewayService } from '../service';
import { GatewayMetadata } from '@nestjs/websockets/interfaces';
import { WebSocketGateway } from '@nestjs/websockets';
import { Type } from '@nestjs/common';

export function createGatewayFactory(
  service: Type<WebSocketGatewayService>,
  config: GatewayMetadata
): Type<WebSocketGatewayService> {
  WebSocketGateway(config)(service);
  return service;
}
