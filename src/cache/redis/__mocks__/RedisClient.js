const redisMock = require("redis-mock");
const { cacheApiResources, promisifyRedisClient } = require("../utils");

const redisClient = promisifyRedisClient(redisMock.createClient());

module.exports = () => ({
  redisClient,
  cacheApiResources: cacheApiResources(redisClient),
  makeNewRedisClient: () => redisMock.createClient(),
});
