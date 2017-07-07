module.exports = {
    entry: ['./src/game.js'],
    output: {
        filename: './app/js/dist/bundle.js'
    },
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['react']
                }
            }
        ]
    }
}
