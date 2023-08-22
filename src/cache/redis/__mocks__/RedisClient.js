const redisMock = require("redis-mock");
const { cacheApiResources } = require("../utils");

const redisClient = redisMock.createClient();

module.exports = () => ({
  redisClient,
  cacheApiResources: cacheApiResources(redisClient),
  makeNewRedisClient: () => redisMock.createClient(),
});
