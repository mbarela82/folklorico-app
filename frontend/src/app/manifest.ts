import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sarape Folklorico",
    short_name: "Sarape",
    description: "Practice and Rehearsal Companion",
    start_url: "/dashboard", // When they open the app, go here
    display: "standalone", // Hides the browser UI (URL bar, etc)
    background_color: "#09090b", // Matches your zinc-950 background
    theme_color: "#4f46e5", // Matches your indigo-600 brand
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png", // Special for iPhones
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
