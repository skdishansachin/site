import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
	markdown: {
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
