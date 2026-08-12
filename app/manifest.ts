import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Done and Done",
    short_name: "Done",
    description: "Get things done, and done.",
    // iOS captures this at install time, so the home screen icon must never
    // launch into a specific project
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
  }
}
