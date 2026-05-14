import { createApp } from "./app.js";
import { initializeDatabase } from "./db.js";

const app = createApp();
const port = Number(process.env.PORT || 3000);

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
