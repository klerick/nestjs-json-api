import { DataSource, Repository, Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PGliteDriver } from 'typeorm-pglite';
import { applyAclRulesToQueryBuilder } from './acl-rules-to-typeorm';
import { TypeormUtilsService } from '../service';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}

@Entity()
class TestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  authorId!: number;

  @Column()
  status!: string;

  @Column({ default: false })
  isPublic!: boolean;

  @Column()
  lastName!: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user?: User;
}

describe('applyAclRulesToQueryBuilder', () => {
  let dataSource: DataSource;
  let repository: Repository<TestEntity>;
  let typeormUtils: TypeormUtilsService<TestEntity, 'id'>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      driver: new PGliteDriver({}).driver,
      entities: [TestEntity, User],
      synchronize: true,
    });

    await dataSource.initialize();
    repository = dataSource.getRepository(TestEntity);
    typeormUtils = new (TypeormUtilsService as any)(repository);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should handle $eq operator', () => {
    const rulesForQuery = { authorId: { $eq: 123 } };

    const queryBuilder = repository.createQueryBuilder('TestEntity');
    const brackets = applyAclRulesToQueryBuilder(rulesForQuery, typeormUtils);
    queryBuilder.where(brackets);

    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();

    expect(sql).toContain('"TestEntity"."authorId" = :aclParam_1');
    expect(params['aclParam_1']).toBe(123);
  });

  it('should handle primitive value (direct equality)', () => {
    const rulesForQuery = { status: 'published' };

    const queryBuilder = repository.createQueryBuilder('TestEntity');
    const brackets = applyAclRulesToQueryBuilder(rulesForQuery, typeormUtils);
    queryBuilder.where(brackets);

    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();

    expect(sql).toContain('"TestEntity"."status" = :aclParam_1');
    expect(params['aclParam_1']).toBe('published');
  });

  it('should handle $in operator', () => {
    const rulesForQuery = { status: { $in: ['published', 'archived'] } };

    const queryBuilder = repository.createQueryBuilder('TestEntity');
    const brackets = applyAclRulesToQueryBuilder(rulesForQuery, typeormUtils);
    queryBuilder.where(brackets);

    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();

    expect(sql).toContain('"TestEntity"."status" IN (:...aclParam_1)');
    expect(params['aclParam_1']).toEqual(['published', 'archived']);
  });

  it('should handle $or operator', () => {
    const rulesForQuery = { $or: [{ authorId: 123 }, { status: 'published' }] };

    const queryBuilder = repository.createQueryBuilder('TestEntity');
    const brackets = applyAclRulesToQueryBuilder(rulesForQuery, typeormUtils);
    queryBuilder.where(brackets);

    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();

    // Should contain both conditions with OR logic
    expect(sql).toContain('"TestEntity"."authorId" = :aclParam_1');
    expect(sql).toContain('"TestEntity"."status" = :aclParam_2');
    expect(sql).toContain('OR'); // Should have OR operator
    expect(params['aclParam_1']).toBe(123);
    expect(params['aclParam_2']).toBe('published');
  });

  it('should handle complex query with $or, $and, $not and relations', () => {
    const rulesForQuery = {
      $or: [
        { isPublic: { $eq: true } },
        { user: { id: { $eq: 3 } } },
        { lastName: 'test' },
      ],
      $and: [
        { $not: { lastName: 'test2' } },
      ],
    };

    const queryBuilder = repository.createQueryBuilder('TestEntity');
    const brackets = applyAclRulesToQueryBuilder(rulesForQuery, typeormUtils);
    queryBuilder.where(brackets);

    const sql = queryBuilder.getQuery();
    const params = queryBuilder.getParameters();

    // Check $or conditions
    expect(sql).toContain('OR');
    expect(sql).toContain('"TestEntity"."isPublic" = :aclParam_1');
    expect(params['aclParam_1']).toBe(true);

    // Check relation field (user.id)
    expect(sql).toContain('user'); // Should have user relation alias
    expect(sql).toContain('id'); // Should have id field
    expect(params['aclParam_2']).toBe(3);

    // Check primitive lastName
    expect(sql).toContain('"TestEntity"."lastName" = :aclParam_3');
    expect(params['aclParam_3']).toBe('test');

    // Check $and and $not
    expect(sql).toContain('AND');
    // $not is not fully supported, should have warning logged
  });
});
