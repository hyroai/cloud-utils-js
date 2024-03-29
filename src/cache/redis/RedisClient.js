const redis = require("redis");
const { cacheApiResources } = require("./utils");

const makeNewRedisClient = (redisConfig) => redis.createClient(redisConfig);

const createRedisClient = (redisConfig) => {
  const redisClient = makeNewRedisClient(redisConfig);

  redisClient.on("ready", () => console.log("Redis client connected"));
  redisClient.on("error", (err) => console.error("Redis client error", err));

  return {
    redisClient,
    cacheApiResources: cacheApiResources(redisClient),
    makeNewRedisClient,
  };
};

module.exports = createRedisClient;
