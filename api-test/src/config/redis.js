import Redis from "ioredis";

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: {},
    })
  : new Redis({
      host: "127.0.0.1",
      port: 6379,
    });

export default redis;