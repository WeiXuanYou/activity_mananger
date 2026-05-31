/**
 * Generate a VAPID key pair for Web Push and print env-ready lines.
 *
 *   node scripts/gen-vapid.mjs
 *
 * Copy the output into your .env (and set NEXT_PUBLIC_VAPID_PUBLIC_KEY to
 * the same public key so the browser can subscribe). Keep the private key
 * secret — anyone with it can send push notifications as your app.
 */
import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("# --- Web Push (VAPID) keys --- add to your .env ---\n");
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_SUBJECT=mailto:you@example.com`);
console.log("\n# The public key appears twice on purpose: the server reads");
console.log("# VAPID_PUBLIC_KEY, the browser reads NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
