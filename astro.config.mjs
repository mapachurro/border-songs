import { defineConfig } from "astro/config";
import { readFile } from "node:fs/promises";

function localFontPlugin() {
  return {
    name: "border-songs-local-font",
    apply: "serve",

    configureServer(server) {
      server.middlewares.use("/__local-fonts", async (req, res, next) => {
        if (req.url !== "/MapachurroAMano-v0.1.otf") {
          return next();
        }

        try {
          const font = await readFile(
            new URL("./local-assets/fonts/MapachurroAMano-v0.1.otf", import.meta.url)
          );

          res.setHeader("Content-Type", "font/otf");
          res.setHeader("Cache-Control", "no-store");
          res.end(font);
        } catch {
          res.statusCode = 404;
          res.end("Local font unavailable");
        }
      });
    },
  };
}

export default defineConfig({
  output: "static",
  site: "https://mapachurro.github.io",
  base: "/border-songs",
  vite: {
    plugins: [localFontPlugin()],
  },
});