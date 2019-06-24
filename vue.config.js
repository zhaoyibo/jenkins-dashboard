// vue.config.js
module.exports = {
    // 修改的配置
    // 将baseUrl: '/api',改为baseUrl: '/',
    // baseUrl: '/',
    devServer: {
        proxy: {
            '/jenkinsapi': {
                target: 'http://testjenkins.wb-intra.com/',
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    '^/jenkinsapi': ''
                }
            }
        }
    }
}