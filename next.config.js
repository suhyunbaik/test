const debug = process.env.NODE_ENV !== 'production'
const name = 'test'

module.exports = {
    assetPrefix: !debug ? `/${name}/` : '',
}