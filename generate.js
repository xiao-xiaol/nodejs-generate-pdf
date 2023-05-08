const puppeteer = require('puppeteer');
const Mustache = require('mustache');
const fs = require('fs');
const path = require('path');
const { compareUpdateTime, getFilePath, getOutputPath } = require('./util.js')

const templateFilePath = path.join(__dirname, '/assets/template.html');


module.exports.generatePDF = (templateData) => {
    return new Promise(async (resolve, reject) => {
        const { type, genderValue, isUpdate, updateTime } = templateData
        const outputPath = getOutputPath([type, genderValue])
        const { filePath } = getFilePath(templateData, outputPath)

        // 是否复用
        const reuse = isUpdate !== true && compareUpdateTime(filePath, updateTime)
        if (reuse) {
            return fs.readFile(filePath, (err, data) => {
                if (err) return reject(err)
                resolve(data)
            })
        }
        fs.readFile(templateFilePath, 'utf8', async (err, templateFile) => {
            if (err) return reject(err)

            const htmlContent = Mustache.render(templateFile, templateData);
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(htmlContent);

            page.on('console', msg => {
                for (let i = 0; i < msg.args().length; ++i)
                  console.log(`${i}: ${msg.args()[i]}`); // 译者注：这句话的效果是打印到你的代码的控制台
            });
            // 设置字体大小
            await page.evaluate(() => dynamicSize())
            const pdfBuffer = await page.pdf({
                path: filePath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    bottom: '10mm',
                    left: '13mm',
                    right: '13mm',
                }
            })

            resolve(pdfBuffer)
            await browser.close();
        })
    })
}

module.exports.generatePDFBatch = (dataList) => {
    return new Promise(async (resolve, reject) => {
        // 文件路径列表
        const filePathList = []
        fs.readFile(templateFilePath, 'utf8', async (err, templateFile) => {
            if (err) return reject(err)

            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            for (let index = 0; index < dataList.length; index++) {
                const templateData = dataList[index];

                const outputPath = getOutputPath(templateData)
                const filePath = getFilePath(templateData, outputPath)
                // 读取文件信息
                const fileInfo = fs.statSync(filePath, { throwIfNoEntry: false })
                // 是否复用
                const reuse = fileInfo && templateData.isUpdate !== true && compareUpdateTime(filePath, templateData.updateTime)
                if (reuse) {
                    filePathList.push(filePath)
                    continue
                }
                
                // 使用Mustache解析模板并插入数据
                const htmlContent = Mustache.render(templateFile, templateData);
                // 加载 HTML 内容并生成 PDF 文件
                await page.setContent(htmlContent);

                await page.pdf({
                    path: filePath,
                    format: 'A4', // 页面格式
                    printBackground: true, // 是否打印背景图
                    margin: { // 页面空白白边
                        top: '10mm',
                        bottom: '10mm',
                        left: '13mm',
                        right: '13mm',
                    }
                });
                filePathList.push(filePath)
            }
            
            resolve(filePathList)
            await browser.close();
        })
    })
}

/**
 * 批量导出为压缩包可以分为两步：批量生成PDF、将文件压缩为压缩包
 * 
 */
/**
 * @description: 生成打印配置
 * @param {*} filePath 文件路径
 * @return {*}
 */
const getPrintOption = (filePath) => {
    return {
        path: filePath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
            top: '10mm',
            bottom: '10mm',
            left: '13mm',
            right: '13mm',
        }
    }
}

/**
 * @description: 生成页面并设置宽高
 * @return { browser: 打开的浏览器, page: 打开的标签页 }
 */
const createPage = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    return { browser, page }
}