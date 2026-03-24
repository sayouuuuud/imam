module.exports = {
    plugins: [
        ['@tailwindcss/postcss', {}],
        ['postcss-preset-env', {
            stage: 2,
            minimumVendorImplementations: 0,
            browsers: 'Chrome >= 80, Safari >= 13, iOS >= 13, Firefox >= 78, Samsung >= 13, UCAndroid >= 12',
            features: {
                'oklab-function': true,
                'color-mix': true,
                'nesting-rules': true,
                'cascade-layers': true,
                'custom-media-queries': true,
                'media-query-ranges': true,
            },
        }],
    ],
}
