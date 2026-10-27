# Migrating from webpack (official guide, excerpt)

## Supported out of the box
- `import` / `require` interop for CommonJS dependencies.
- `process.env.*` is replaced statically; only `import.meta.env.VITE_*` reaches
  the client at runtime.
- `require.context` is **not supported**; use `import.meta.glob`.

## Not supported
- webpack-specific loaders with no Vite equivalent (`worker-loader`,
  `raw-loader` — use `?raw`, `?worker` import suffixes instead).
- `ProvidePlugin` globals.
- Multi-compiler configs (`webpack.config.js` returning an array).

## Config translation
- `resolve.alias` → `resolve.alias` (same shape).
- `optimization.splitChunks` → `build.rollupOptions.output.manualChunks`.
- `devServer.proxy` → `server.proxy`.

## Migration order the guide recommends
1. Add `vite.config.ts` beside the webpack config.
2. Move HTML to the root as `index.html` (Vite's entry).
3. Convert one entry at a time; keep webpack as the fallback until dev and
   production builds both work.
