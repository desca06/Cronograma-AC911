import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AC911 - Gestión Administrativa",
    short_name: "AC911",
    description: "Sistema administrativo y operativo de AC911.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
  };
}