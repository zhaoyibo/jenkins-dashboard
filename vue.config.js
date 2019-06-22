// vue.config.js
module.exports = {
    // 修改的配置
    // 将baseUrl: '/api',改为baseUrl: '/',
    // baseUrl: '/',
    devServer: {
        proxy: {
            '/api': {
                target: 'http://testjenkins.wb-intra.com/',
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
}