import {
  AclAction,
  AclRule,
  AclRulesLoader,
  AclSubject,
} from '@klerick/acl-json-api-nestjs';
import {
  ContextTestAcl,
} from '@nestjs-json-api/microorm-database';
import { AnyEntity, EntityRepository } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class RulesLoaderService implements AclRulesLoader {
  @InjectRepository(ContextTestAcl, 'default')
  private readonly contextTestAcl!: EntityRepository<ContextTestAcl>;

  async getContext(): Promise<{ [x: string]: any }> {
    const contexts = await this.contextTestAcl.findAll();
    const context = contexts.at(0);
    if (!context) return {}
    return context.context;
  }
  async getHelpers(): Promise<{ [x: string]: (...arg: any[]) => any }> {
    return {
      removeMyselfOnly: (oldArray: number[], userId: number): number[] => {
        return oldArray.filter(id => id !== userId);
      }
    };
  }
  async loadRules<E extends AnyEntity>(
    entity: AclSubject<E>,
    action: AclAction
  ): Promise<AclRule<E>[]> {
    const contexts = await this.contextTestAcl.findAll();
    const context = contexts.at(0);
    if (!context) return []

    const rules = context.aclRules.rules as unknown as AclRule<E>[]

    return rules.filter(r => r.action === action && (entity as any)['name'] === r.subject)

  }
}
