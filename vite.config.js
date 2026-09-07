import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// docs: https://vitejs.dev/guide/build.html
export default defineConfig({
    base: '',
    root: 'site',
    // Vitest inherits `root` above, which would exclude src/ from test discovery, so the
    // test root is pinned back to the repo. `resolve.conditions` is applied only under
    // Vitest so the browser build of Svelte is used for component tests.
    test: {
        root: '.',
        environment: 'jsdom',
        include: ['src/**/*.test.js'],
    },
    resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
    publicDir: 'public',
    build: {
        outDir: './build/',
        emptyOutDir: false,
        rollupOptions: {
            input: { index: 'src/index.js' },
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
        sourcemap: true,
    },
    plugins: [
        svelte(),
        {
            name: 'redirect-root',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/') {
                        res.writeHead(302, { Location: '/site/index.html' });
                        res.end();
                    } else {
                        next();
                    }
                });
            },
        },
    ],
});
