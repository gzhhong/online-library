import CosSDK from 'cos-nodejs-sdk-v5';
import request from 'request';
import fs from 'fs';

// 统一的 COS 配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET,
  Region: 'ap-shanghai'
};

// 打印环境变量状态
console.log('COS Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RUNENV: process.env.TENCENTCLOUD_RUNENV,
  hasBucket: !!process.env.COS_BUCKET,
  hasSecretId: !!process.env.TENCENTCLOUD_SECRETID,
  hasSecretKey: !!process.env.TENCENTCLOUD_SECRETKEY,
  hasSessionToken: !!process.env.TENCENTCLOUD_SESSIONTOKEN,
  actualSecretId: process.env.TENCENTCLOUD_SECRETID?.slice(0, 8) + '...',
  actualSecretKey: process.env.TENCENTCLOUD_SECRETKEY?.slice(0, 8) + '...',
});

// 统一的 COS 实例
const COS = new CosSDK({
  SecretId: process.env.TENCENTCLOUD_SECRETID,
  SecretKey: process.env.TENCENTCLOUD_SECRETKEY,
  SecurityToken: process.env.TENCENTCLOUD_SESSIONTOKEN
});

// 统一的上传函数
export async function uploadToCOS(localPath, cloudPath) {
  console.log('Starting uploadToCOS:', { 
    localPath, 
    cloudPath,
    hasSecretId: !!process.env.TENCENTCLOUD_SECRETID,
    hasSecretKey: !!process.env.TENCENTCLOUD_SECRETKEY,
    hasSessionToken: !!process.env.TENCENTCLOUD_SESSIONTOKEN
  });
  
  try {
    // 获取文件元数据
    console.log('Getting file metadata...');
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
        if (err) {
          console.error('Metadata request failed:', err);
          reject(err);
        }
        console.log('Metadata response:', response.body);
        resolve(JSON.parse(response.body));
      });
    });
    console.log('Got metadata:', metaRes);

    console.log('Uploading to COS with params:', {
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath,
      fileSize: fs.statSync(localPath).size,
      hasMetaId: !!metaRes.respdata?.x_cos_meta_field_strs?.[0]
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
        if (err) {
          console.error('COS upload error:', err);
          reject(err);
        } else {
          console.log('COS upload success:', data);
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Upload error in uploadToCOS:', error);
    throw error;
  }
}

// 统一的下载函数
export async function getFileFromCOS(cloudPath) {
  console.log('Getting file from COS:', { 
    cloudPath,
    hasSecretId: !!process.env.TENCENTCLOUD_SECRETID,
    hasSecretKey: !!process.env.TENCENTCLOUD_SECRETKEY,
    hasSessionToken: !!process.env.TENCENTCLOUD_SESSIONTOKEN
  });

  return new Promise((resolve, reject) => {
    const params = {
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath,
      Output: process.stdout
    };
    console.log('GetObject params:', params);

    COS.getObject(params, function(err, data) {
      if (err) {
        console.error('COS getObject error:', err);
        reject(err);
      } else {
        console.log('COS getObject success:', {
          statusCode: data.statusCode,
          headers: data.headers
        });
        resolve(data);
      }
    });
  });
}

// 统一的删除函数
export async function deleteFromCOS(cloudPath) {
  console.log('Deleting file from COS:', { 
    cloudPath,
    hasSecretId: !!process.env.TENCENTCLOUD_SECRETID,
    hasSecretKey: !!process.env.TENCENTCLOUD_SECRETKEY,
    hasSessionToken: !!process.env.TENCENTCLOUD_SESSIONTOKEN
  });

  return new Promise((resolve, reject) => {
    const params = {
      Bucket: cosConfig.Bucket,
      Region: cosConfig.Region,
      Key: cloudPath
    };
    console.log('DeleteObject params:', params);

    COS.deleteObject(params, function(err, data) {
      if (err) {
        console.error('COS deleteObject error:', err);
        reject(err);
      } else {
        console.log('COS deleteObject success:', data);
        resolve(data);
      }
    });
  });
}

export default COS;