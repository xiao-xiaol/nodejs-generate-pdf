const http = require('http')
const { getPdf, getPdfBatch } = require('./controller')

http.createServer(async (req, res) => {
    try {
        const {url,method} = req;
        if (url === '/getPdf' && method === 'POST') {
            await getPdf(req, res)
        } else if (url === '/getPdfBatch' && method === 'POST') {
            getPdfBatch(req, res)
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({
                status: 404,
                error: 'Not Found',
                method: method,
                path: url
            }))
        }
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
            status: 400,
            error: err.message
        }))
    }
}).listen(8001, () => {
    console.log('listen:8001')
})
