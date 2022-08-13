import redis from "./cache/redis";
import storage from "./storage/storage";
import vault from "./vault";

export const cache = { redis };

export { storage, vault };
