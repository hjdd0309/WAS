import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const port = Number(process.env.PORT) || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
  console.log(`swagger docs at http://localhost:${port}/docs`);
});
