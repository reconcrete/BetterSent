import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// Public key pinning the extension ID to "fbimedfnalioofncdcpcojjfkdfknlol",
// so the origin chrome-extension://fbimedfnalioofncdcpcojjfkdfknlol can be
// added to the API's TRUSTED_ORIGINS. The matching private key lives in
// keys/chrome-extension.pem (gitignored, only needed for .crx packaging).
const MANIFEST_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0Niv1qYORVhevPyAp82iRsauAMqRAnVL1Nqc1AroCsY5Pla4LYMB1DRyN2YYXK1gnwOYKAfNoxey77/QSXXVH3LtGiNRTMrikGfqpmdotk0+4NBFJKPrk1ZtIoQLUUqQ4pJ77gMVKG1LZj0U07Q7BklD3Xg9sQeBPjKJU2VeBhRaQbCVJdIb6IE5V7y5/SRRjo/jRmqHn7GyiZfno5Bmfdaj0H0NisIHRpp9/0nnGg9ECx9l5arjfd9jz50NvcYGruyA6ZObasXKv1c+c86ySWYyW28sE7YEHQFE1mmfWZbQ0SsURn5BhBQe3Em4rlOQWoE77ohrDegcqj2Zjl1QcQIDAQAB";

export default defineConfig({
  srcDir: "src",
  publicDir: "public",
  modules: ["@wxt-dev/module-react"],
  alias: {
    "~api": "../api/src",
  },
  manifest: {
    name: "Bettersent",
    description: "Send the current page, a link, or selected text to your Kindle.",
    key: MANIFEST_KEY,
    permissions: ["activeTab", "contextMenus", "notifications", "scripting"],
    host_permissions: ["http://localhost:8080/*", "https://api.bettersent.com/*"],
  },
  vite: () => ({
    // Cast: the monorepo has multiple vite copies (web pins rolldown-vite),
    // so the plugin's Plugin type and wxt's PluginOption resolve to different
    // vite type identities even at compatible versions.
    plugins: [tailwindcss() as never],
  }),
});
