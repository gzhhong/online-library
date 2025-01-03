import CosSDK from 'cos-nodejs-sdk-v5';
import request from 'request';
import fs from 'fs';

// 统一的 COS 配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET,
  Region: 'ap-shanghai'
};

// 统一的 COS 实例
const COS = new CosSDK({
  SecretId: process.env.TENCENTCLOUD_SECRETID,
  SecretKey: process.env.TENCENTCLOUD_SECRETKEY,
  SecurityToken: process.env.TENCENTCLOUD_SESSIONTOKEN
});

// 统一的上传函数
export async function uploadToCOS(localPath, cloudPath) {
  console.log('Starting uploadToCOS:', { localPath, cloudPath });
  
  try {
    // 获取文件元数据
    const metaRes = await new Promise((resolve, reject) => {
      request({
        url: 'http://api.weixin.qq.com/_/cos/metaid/encode',
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          openid: '',
          bucket: cosConfig.Bucket,
          paths: [cloudPath]
        })
      }, function(err, response) {
        if (err) reject(err);
        resolve(JSON.parse(response.body));
      });
    });

    return new Promise((resolve, reject) => {
      COS.putObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: cloudPath,
        StorageClass: 'STANDARD',
        Body: fs.createReadStream(localPath),
        ContentLength: fs.statSync(localPath).size,
        Headers: {
          'x-cos-meta-fileid': metaRes.respdata.x_cos_meta_field_strs[0]
        }
      }, function(err, data) {
        if (err) reject(err);
        else resolve(data);
      });
    });
  } catch (error) {
    console.error('Upload error in uploadToCOS:', error);
    throw error;
  }
}

// 统一的下载函数
export async function getFileFromCOS(cloudPath) {
  console.log('Getting file from COS:', { cloudPath });

  return new Promise((resolve, reject) => {
    COS.getObject({
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath,
      Output: process.stdout
    }, function(err, data) {
      if (err) {
        console.error('COS getObject error:', err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export default COS;