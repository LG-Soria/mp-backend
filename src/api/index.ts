// api/index.ts
import { createServer } from "http";
import app from "../app";

module.exports = (req: any, res: any) => {
  const server = createServer(app);
  server.emit("request", req, res);
};
