
const { generatePDF, generatePDFBatch } = require('./generate.js')
const { readBody } = require('./util.js')
const archiver = require('archiver')

module.exports.getPdf = async (req, res) => {
    const body = await readBody(req)
    const fileBuffer = await generatePDF(body)
    res.writeHead(200, {
        'Access-Control-Expose-Headers': 'Content-Disposition',
        'Content-Type': 'application/pdf;charset=utf-8',
        'Content-Length': fileBuffer.length
    });
    res.end(fileBuffer)
}

module.exports.getPdfBatch = async (req, res) => {
    const body = await readBody(req)
    // 批量生成pdf并且返回文件地址列表
    const filePathList = await generatePDFBatch(body)

    // 压缩并响应文件流
    const zip = archiver('zip', {
        zlib: { level: 9 } // 设置压缩级别
    });
    
    zip.pipe(res);

    for (const { filePath, fileName } of filePathList) {
        zip.file(filePath, { name: fileName });
    }

    zip.finalize();
}
