// vue.config.js
module.exports = {
    // 修改的配置
    // 将baseUrl: '/jenkinsapi',改为baseUrl: '/',
    // baseUrl: '/',
    devServer: {
        proxy: {
            '/testjenkinsapi': {
                target: 'http://testjenkins.wb-intra.com',
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    '^/testjenkinsapi': '/'
                }
            },
            '/devjenkinsapi': {
                target: 'http://devjenkins.wb-intra.com',
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    '^/devjenkinsapi': '/'
                }
            }
        }
    }
}