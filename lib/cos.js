import CosSDK from 'cos-nodejs-sdk-v5';
import request from 'request';
import fs from 'fs';

// 统一的 COS 配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET,
  Region: 'ap-shanghai'
};

// 打印环境变量状态
console.log('COS Module Loaded. Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RUNENV: process.env.TENCENTCLOUD_RUNENV,
  hasBucket: !!process.env.COS_BUCKET
});

// 使用 Promise 包装的 request
function call(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

// COS 实例
let cosInstance = null;

// 初始化 COS
async function initCOS() {
  if (cosInstance) {
    return cosInstance;
  }

  console.log('Initializing COS...');
  try {
    cosInstance = new CosSDK({
      getAuthorization: async function (options, callback) {
        try {
          console.log('Getting COS authorization...');
          const res = await call({
            url: 'http://api.weixin.qq.com/_/cos/getauth',
            method: 'GET',
          });
          console.log('Got authorization response');
          const info = JSON.parse(res);
          const auth = {
            TmpSecretId: info.TmpSecretId,
            TmpSecretKey: info.TmpSecretKey,
            SecurityToken: info.Token,
            ExpiredTime: info.ExpiredTime,
          };
          console.log('Authorization info:', {
            hasSecretId: !!auth.TmpSecretId,
            hasSecretKey: !!auth.TmpSecretKey,
            hasToken: !!auth.SecurityToken,
            expiredTime: auth.ExpiredTime
          });
          callback(auth);
        } catch (error) {
          console.error('Failed to get authorization:', error);
          callback(error);
        }
      },
    });
    console.log('COS initialized successfully');
    return cosInstance;
  } catch (error) {
    console.error('COS initialization failed:', error);
    throw error;
  }
}

// 统一的上传函数
export async function uploadToCOS(localPath, cloudPath) {
  console.log('Starting uploadToCOS:', { 
    localPath, 
    cloudPath,
    fileExists: fs.existsSync(localPath)
  });
  
  try {
    const cos = await initCOS();
    
    // 获取文件元数据
    console.log('Getting file metadata...');
    const metaRes = await call({
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
    });
    
    const metadata = JSON.parse(metaRes);
    console.log('Got metadata:', metadata);

    return new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: cloudPath,
        StorageClass: 'STANDARD',
        Body: fs.createReadStream(localPath),
        ContentLength: fs.statSync(localPath).size,
        Headers: {
          'x-cos-meta-fileid': metadata.respdata.x_cos_meta_field_strs[0]
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
  console.log('Getting file from COS:', { cloudPath });

  try {
    const cos = await initCOS();
    return new Promise((resolve, reject) => {
      cos.getObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: cloudPath,
        Output: process.stdout
      }, function(err, data) {
        if (err) {
          console.error('COS getObject error:', err);
          reject(err);
        } else {
          console.log('COS getObject success');
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Get file error:', error);
    throw error;
  }
}

// 统一的删除函数
export async function deleteFromCOS(cloudPath) {
  console.log('Deleting file from COS:', { cloudPath });

  try {
    const cos = await initCOS();
    return new Promise((resolve, reject) => {
      cos.deleteObject({
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: cloudPath
      }, function(err, data) {
        if (err) {
          console.error('COS deleteObject error:', err);
          reject(err);
        } else {
          console.log('COS deleteObject success:', data);
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

export default initCOS;