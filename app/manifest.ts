/**
 * PWA manifest. Lets users install 相聚 onto their phone home screen,
 * launch it without browser chrome, and gives the OS the icons it needs
 * for the launcher / app switcher / share targets.
 *
 * Next.js automatically serves this at /manifest.webmanifest when this
 * file exports a default `MetadataRoute.Manifest`.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "相聚 · Together",
    short_name: "相聚",
    description: "給家人與朋友的活動、投票、文章與自訂頁面",
    start_url: "/app/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF7F1",
    theme_color: "#C75B3A",
    lang: "zh-Hant",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["social", "lifestyle"],
  };
}
