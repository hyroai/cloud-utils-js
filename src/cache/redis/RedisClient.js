const redis = require("redis");
const { promisifyRedisClient } = require("./utils");

const makeNewRedisClient = (redisConfig) => redis.createClient(redisConfig);

const redisClient = (redisConfig) => makeNewRedisClient(redisConfig);

redisClient.on("ready", () => console.log("Redis client connected"));

redisClient.on("error", (err) => console.error("Redis client error", err));

module.exports = (redisConfig) => ({
  ...promisifyRedisClient(redisClient(redisConfig)),
  makeNewRedisClient,
});
