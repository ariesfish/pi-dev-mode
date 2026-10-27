# Current build

webpack 5, one config, three entries (`app`, `admin`, `embed`), `require.context`
used by the i18n loader, a custom `process.env.BUILD_SHA` injected by
DefinePlugin, and `splitChunks` tuned by hand.
