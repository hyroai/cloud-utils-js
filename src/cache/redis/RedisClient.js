const redis = require("redis");
const { cacheApiResources, promisifyRedisClient } = require("./utils");

const makeNewRedisClient = (redisConfig) => redis.createClient(redisConfig);

module.exports = (redisConfig) => {
  const redisClient = promisifyRedisClient(makeNewRedisClient(redisConfig));

  redisClient.on("ready", () => console.log("Redis client connected"));

  redisClient.on("error", (err) => console.error("Redis client error", err));

  return {
    redisClient,
    cacheApiResources: cacheApiResources(redisClient),
    makeNewRedisClient,
  };
};
