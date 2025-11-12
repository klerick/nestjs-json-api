import { Permissions } from '../acl';

export const CheckFieldAndInclude: Permissions = {
  admin({ can, cannot }) {
    can('getAll', 'UserProfileAcl');
    can('getAll', 'UsersAcl');
    can('getOne', 'UsersAcl');
    can('getOne', 'UserProfileAcl');
    can('deleteOne', 'ArticleAcl');
    can('postOne', 'ArticleAcl');
    can('patchOne', 'ArticleAcl');
    can('getRelationship', 'UsersAcl', ['profile', 'posts']);
    can('deleteRelationship', 'UsersAcl', ['posts', 'aclComments']);
    can('postRelationship', 'UsersAcl', ['posts', 'aclComments']);
    can('patchRelationship', 'UsersAcl', ['posts', 'aclComments']);
  },
  user({ can, cannot }) {
    can(
      'getAll',
      'UserProfileAcl',
      ['firstName', 'lastName', 'bio', 'avatar', 'phone'],
      {
        'user.id': {
          $eq: '${currentUser.id}'
        },
      }
    );
    can(
      'getAll',
      'UserProfileAcl',
      ['firstName', 'lastName', 'bio', 'avatar'],
      {
        isPublic: {
          $eq: true,
        },
      }
    );
    can(
      'getOne',
      'UserProfileAcl',
      ['firstName', 'lastName', 'bio', 'avatar', 'phone'],
      {
        'user.id': {
          $eq: '${currentUser.id}'
        },
      }
    );
    can(
      'getOne',
      'UserProfileAcl',
      ['firstName', 'lastName', 'bio', 'avatar'],
      {
        isPublic: {
          $eq: true,
        },
      }
    );
    can('deleteOne', 'ArticleAcl', {
      'author.id':  {
        $eq: '${currentUser.id}'
      },
      status: {
        $ne: 'published'
      },
    });
    can('postOne', 'ArticleAcl', {
      'author.id':  {
        $eq: '${currentUser.id}'
      },
      status: {
        $ne: 'published'
      },
    });
    can('patchOne', 'ArticleAcl', ['coAuthorIds'], {
      '__current.coAuthorIds': {
        $in: ['${currentUser.id}']
      },
      'coAuthorIds': {
        $all: '${removeMyselfOnly(@input.__current.coAuthorIds, currentUser.id)}',
        $size: '${@input.__current.coAuthorIds.length - 1}'
      }
    });
    can('patchOne', 'ArticleAcl', {
      'author.id':  {
        $eq: '${currentUser.id}'
      },
    });
    can('getRelationship', 'UsersAcl', ['posts', 'profile'], {
      'id': {
        $eq: '${currentUser.id}'
      },
    });
    can('deleteRelationship', 'UsersAcl', ['aclComments'], {
      'id': {
        $eq: '${currentUser.id}'
      },
    });
    can('postRelationship', 'UsersAcl', ['aclComments'], {
      'id': {
        $eq: '${currentUser.id}'
      },
    });
    can('patchRelationship', 'UsersAcl', ['aclComments'], {
      'id': {
        $eq: '${currentUser.id}'
      },
    });
  },
  moderator({ can, cannot }) {
    can('getAll', 'UsersAcl', [
      '*',
      'posts.*',
      'aclComments.*',
      'createdTags.*',
      'authoredArticles.*',
      'editedArticles.*',
      'documents.*',
      'profile.id',
      'profile.firstName',
      'profile.lastName',
      'profile.bio',
      'profile.avatar',
      'profile.phone',
      'profile.isPublic',
      'profile.role',
      'profile.createdAt',
      'profile.updatedAt',
    ]);
    can('getAll', 'UserProfileAcl', [
      'firstName',
      'lastName',
      'bio',
      'avatar',
      'phone',
      'createdAt',
      'updatedAt'
    ]);
    can('getOne', 'UsersAcl', [
      '*',
      'posts.*',
      'aclComments.*',
      'createdTags.*',
      'authoredArticles.*',
      'editedArticles.*',
      'documents.*',
      'profile.id',
      'profile.firstName',
      'profile.lastName',
      'profile.bio',
      'profile.avatar',
      'profile.phone',
      'profile.isPublic',
      'profile.role',
      'profile.createdAt',
      'profile.updatedAt',
    ])
    can('getOne', 'UserProfileAcl', [
      'firstName',
      'lastName',
      'bio',
      'avatar',
      'phone',
      'createdAt',
      'updatedAt'
    ]);
    can('deleteOne', 'ArticleAcl', {
      status: {
        "$in": ["published", "draft"]
      },
    });
    can('postOne', 'ArticleAcl', {
      'author.id':  {
        $eq: '${currentUser.id}'
      }
    });
    can('patchOne', 'ArticleAcl', ['status'], {
      status: {
        $ne: 'published'
      }
    });
    can('patchOne', 'ArticleAcl', ['status'], {
      status: 'review'
    });
    can('getRelationship', 'UsersAcl', ['posts']);
    can('deleteRelationship', 'UsersAcl', ['posts']);
    can('postRelationship', 'UsersAcl', ['posts']);
    can('patchRelationship', 'UsersAcl', ['posts']);
  },
};
