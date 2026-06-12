import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { getJwtSecret } from "./config/security.js";

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    getJwtSecret();
    await connectDatabase();
    app.listen(port, () => {
      console.log(`API server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
