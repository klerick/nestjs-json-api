import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EntityData } from '@mikro-orm/core';
import { AclContext } from '../acl.seed';
import { CategoryFactory } from '../factory';
import { CategoryAcl } from '../../../entities';

export class CategorySeed extends Seeder {
  async run(em: EntityManager, context: AclContext): Promise<void> {
    const categoryFactory = new CategoryFactory(em);

    const firstLevelCatData: EntityData<CategoryAcl>[] = [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Technology and programming topics',
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Lifestyle and personal development',
      },
      {
        name: 'Inactive Category',
        slug: 'inactive-category',
        description: 'This category is inactive',
        isActive: false,
      },
    ];
    const countFirstLevel = firstLevelCatData.length;
    const [techCategory, lifestyleCategory, inactiveCategory] = await categoryFactory
      .each((category) => Object.assign(category, firstLevelCatData.shift()))
      .create(countFirstLevel);

    const secondLevelCatData: EntityData<CategoryAcl>[] = [
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend and backend web development',
        parent: techCategory,
      },
      {
        name: 'Artificial Intelligence',
        slug: 'artificial-intelligence',
        description: 'AI and machine learning',
        parent: techCategory,
      },
      {
        name: 'Health & Fitness',
        slug: 'health-fitness',
        description: 'Health tips and fitness guides',
        parent: lifestyleCategory,
      },
    ];
    const countSecondLevel = secondLevelCatData.length;
    const [webDevCategory, aiCategory, healthCategory] = await categoryFactory
      .each((category) => Object.assign(category, {level: 1}, secondLevelCatData.shift()))
      .create(countSecondLevel);



    context.aclContext.categories = [techCategory, lifestyleCategory, inactiveCategory, webDevCategory, aiCategory, healthCategory]
  }
}
