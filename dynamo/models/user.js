const createClient = require('../util');

const FIELDS = {
  ID: 'id',
  USERNAME: 'username',
  USERNAME_LOWER: 'usernameLower',
  PASSWORD_HASH: 'passwordHash',
  EMAIL: 'email',
  ABOUT: 'about',
  HIDE_TAG_COLORS: 'hideTagColors',
  FOLLOWED_CUBES: 'followedCubes',
  FOLLOWED_USERS: 'followedUsers',
  USERS_FOLLOWING: 'following',
  IMAGE_NAME: 'imageName',
  ROLES: 'roles',
  THEME: 'theme',
  HIDE_FEATURED: 'hideFeatured',
  PATRON_ID: 'patron',
};

const ROLES = {
  ADMIN: 'Admin',
  CONTENT_CREATOR: 'ContentCreator',
  PATRON: 'Patron',
};

const client = createClient({
  name: 'USERS',
  partitionKey: FIELDS.ID,
  attributes: {
    [FIELDS.ID]: 'S',
    [FIELDS.USERNAME_LOWER]: 'S',
    [FIELDS.EMAIL]: 'S',
  },
  indexes: [
    {
      partitionKey: FIELDS.USERNAME_LOWER,
      name: 'ByUsername',
    },
    {
      partitionKey: FIELDS.EMAIL,
      name: 'ByEmail',
    },
  ],
  FIELDS,
});

module.exports = {
  getById: async (id) => {
    return (await client.get(id)).Item;
  },
  getByUsername: async (username, lastKey) => {
    const result = await client.query({
      IndexName: 'ByUsername',
      KeyConditionExpression: `#p1 = :uname`,
      ExpressionAttributeValues: {
        ':uname': username.toLowerCase(),
      },
      ExpressionAttributeNames: {
        '#p1': FIELDS.USERNAME_LOWER,
      },
      ExclusiveStartKey: lastKey,
    });
    return {
      items: result.Items,
      lastKey: result.LastEvaluatedKey,
    };
  },
  getByEmail: async (email, lastKey) => {
    const result = await client.query({
      IndexName: 'ByEmail',
      KeyConditionExpression: `#p1 = :email`,
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
      },
      ExpressionAttributeNames: {
        '#p1': FIELDS.EMAIL,
      },
      ExclusiveStartKey: lastKey,
    });
    return {
      items: result.Items,
      lastKey: result.LastEvaluatedKey,
    };
  },
  update: async (document) => {
    if (!document[FIELDS.ID]) {
      throw new Error('Invalid document: No partition key provided');
    }
    return client.put(document);
  },
  put: async (document) =>
    client.put({
      [FIELDS.USERNAME_LOWER]: document[FIELDS.USERNAME].toLowerCase(),
      ...document,
    }),
  batchPut: async (documents) => client.batchPut(documents),
  batchGet: async (ids) => client.batchGet(ids.map((id) => `${id}`)),
  createTable: async () => client.createTable(),
  convertUser: (user) => ({
    [FIELDS.ID]: `${user._id}`,
    [FIELDS.USERNAME]: user.username,
    [FIELDS.USERNAME_LOWER]: user.username_lower,
    [FIELDS.PASSWORD_HASH]: user.password,
    [FIELDS.EMAIL]: user.email.toLowerCase(),
    [FIELDS.ABOUT]: user.about,
    [FIELDS.HIDE_TAG_COLORS]: user.hide_tag_colors,
    [FIELDS.FOLLOWED_CUBES]: user.followed_cubes.map((id) => `${id}`),
    [FIELDS.FOLLOWED_USERS]: user.followed_users.map((id) => `${id}`),
    [FIELDS.USERS_FOLLOWING]: user.users_following.map((id) => `${id}`),
    [FIELDS.IMAGE_NAME]: user.image_name,
    [FIELDS.ROLES]: user.roles,
    [FIELDS.THEME]: user.theme,
    [FIELDS.HIDE_FEATURED]: user.hide_featured,
    [FIELDS.PATRON_ID]: `${user.patron}`,
  }),
  ROLES,
  FIELDS,
};
