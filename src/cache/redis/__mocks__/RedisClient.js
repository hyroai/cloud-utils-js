const redisMock = require("redis-mock");
const { promisifyRedisClient } = require("../utils");

const redisClient = redisMock.createClient();

module.exports = () => ({
  ...promisifyRedisClient(redisClient),
  makeNewRedisClient: () => redisMock.createClient(),
});
