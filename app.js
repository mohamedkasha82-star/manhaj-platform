import express from "express";
import { createProxyMiddleware as cp } from "http-proxy-middleware";
import { spawn } from "child_process";
spawn("node", ["server.js"]);
spawn("node", ["warroom.js"]);
spawn("node", ["community.js"]);
setTimeout(() => {
  const a = express();
  const p = x => cp({ target: `http://localhost:${x}`, changeOrigin: true });
  a.use("/warroom", p(3001));
  a.use("/api/applications", p(3001));
  a.use("/community", p(3002));
  a.use("/api/posts", p(3002));
  a.use("/", p(3000));
  a.listen(process.env.PORT || 8080, () => console.log("\n🚀 المنصة الموحّدة: http://localhost:8080\n"));
}, 3000);
