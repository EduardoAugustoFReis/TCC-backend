import jwt from "jsonwebtoken";
import {promisify}  from "util";
import authConfig from "../config/authConfig.js";
import redis from "../config/redis.js";

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({error: "Token não existe."});
  };

  const [, token] = authHeader.split(" ");

  try {

    // verifica se token está na blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(403).json({ error: "Token inválidado por logout" });
    }

    const decoded = await promisify(jwt.verify)(token, authConfig.secret);
    
    req.userId = decoded.id;
    req.userRole = decoded.role;

    return next();
  } catch (error) {
    return res.status(401).json({error: "Token inválido."});
  }
}