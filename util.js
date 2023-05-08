

const fs = require('fs');
const path = require('path');
module.exports.readBody = (req) => {
    return new Promise((resolve, reject) => {
        let payload = '';
        req.on('data', (chunk) => {
            payload += chunk;
        });
        req.on('end', () => {
            try {
                const bodyData =  JSON.parse(payload)
                resolve(bodyData)
            } catch (error) {
                reject(error)
            }
        });
    })
}
/**
 * @description: 生成文件路径和文件名称
 * @param { name: 姓名, idNumber: 身份证号 } 
 * @param {String} dirPath 文件路径
 * @return { filePath: 文件路径, fileName: 文件名称 } 
 */
module.exports.getFilePath = ({ name, idNumber }, dirPath) => {
    const fileName = `${name}${idNumber}.pdf`
    const filePath = path.join(dirPath, fileName)
    return {
        fileName,
        filePath
    }
}


const outputBasePath = path.join(__dirname, '/output');
/**
 * @description: 判断是否存在输出文件夹，没有就创建，返回输出文件夹
 * @param { definePlanId } {  definePlanId: 计划id }
 * @return {*} 返回文件存放路径
 */
module.exports.getOutputPath = (dirnames) => {
    let dirPath = outputBasePath
    for (const dirname of dirnames) {
        dirPath = path.join(dirPath, String(dirname))
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    }

    return dirPath
}


/**
 * @description: 对比文件和数据更新时间，判断是否可复用文件
 * @param {string} filePath 文件地址
 * @param {string} updateTime 数据更新时间
 * @return {boolean} true：文件可复用，false：文件不可复用
 */
module.exports.compareUpdateTime = (filePath, updateTime) => {
    try {
        // 读取文件信息
        const fileInfo = fs.statSync(filePath, { throwIfNoEntry: false })

        // 没有文件信息或者没有数据更新时间
        if (!fileInfo || !updateTime) return false
        
        // 文件信息的mtime字段是此文件最后一次修改的时间戳（Date对象）
        // 将Date对象转成和updateTime字段相同格式的时间戳，如果是 Unix 时间戳需要注意是否包含毫秒数
        const fileTime = fileInfo.mtime.getTime()

        // 文件修改时间比数据更新时间大就返回 true
        if (fileTime > updateTime) return true

        return false
    } catch (error) {
        return false
    }
}




module.exports.getParams = (url) => {
    const str = url.substr(url.indexOf('?') + 1)
    const arr = str.split('&')
    const result = {}
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i].split('=')
        result[item[0]] = item[1]
    }
    return result
}