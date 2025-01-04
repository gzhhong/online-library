import CosSDK from 'cos-nodejs-sdk-v5';
import request from 'request';
import fs from 'fs';
import path from 'path';

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

  try {
    cosInstance = new CosSDK({
      getAuthorization: async function (options, callback) {
        try {
          console.log('Getting COS authorization...');
          const res = await call({
            url: 'http://api.weixin.qq.com/_/cos/getauth',
            method: 'GET',
          });
          const info = JSON.parse(res);
          const auth = {
            TmpSecretId: info.TmpSecretId,
            TmpSecretKey: info.TmpSecretKey,
            SecurityToken: info.Token,
            ExpiredTime: info.ExpiredTime,
          };

          callback(auth);
        } catch (error) {
          console.error('Failed to get authorization:', error);
          callback(error);
        }
      },
    });
    return cosInstance;
  } catch (error) {
    console.error('COS initialization failed:', error);
    throw error;
  }
}

// 统一的上传函数
export async function uploadToCOS(localPath, cloudPath) {
  console.log('Starting uploadToCOS:');
  
  try {
    const cos = await initCOS();
    
    // 获取文件元数据
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
        var requestId = (err || data).headers['x-cos-request-id'];
        console.log("requestID is", requestId );
    
        if (err) {
          console.error('COS upload error:', err);
          reject(err);
        } else {

          resolve(data);
        }
      });
    });
  } catch (error) {
    console.error('Upload error in uploadToCOS:', error);
    throw error;
  }
}

// 统一的下载函数 - 支持两种模式
export async function getFileFromCOS(cloudPath, localPath = null) {
  console.log('Getting file from COS:', { cloudPath, localPath });

  try {
    const cos = await initCOS();
    return new Promise((resolve, reject) => {
      const options = {
        Bucket: cosConfig.Bucket,
        Region: cosConfig.Region,
        Key: cloudPath,
      };

      // 如果提供了本地路径，就下载到文件
      if (localPath) {
        options.Output = path.join(process.cwd(), localPath);
      }

      cos.getObject(options, function(err, data) {
        if (err) {
          console.error('COS getObject error:', err);
          reject({
            code: -1,
            msg: err.message,
            error: err
          });
        } else {

          if (data.statusCode === 200) {
            resolve({
              code: 0,
              data: data,
              ...(localPath ? { file: options.Output } : {})
            });
          } else {
            reject({
              code: 1,
              msg: `Unexpected status code: ${data.statusCode}`,
              data: data
            });
          }
        }
      });
    });
  } catch (error) {
    console.error('Get file error:', error);
    throw {
      code: -1,
      msg: error.message,
      error: error
    };
  }
}

// 修改 API handler 来使用新的返回格式
export async function streamFileToResponse(cloudPath, res) {
  try {
    const result = await getFileFromCOS(cloudPath);
    
    if (result.code === 0) {
      // 设置响应头
      if (result.data.headers) {
        Object.entries(result.data.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // 检查响应类型并相应处理
      if (Buffer.isBuffer(result.data.Body)) {
        // 如果是 Buffer，直接发送
        res.send(result.data.Body);
      } else if (typeof result.data.Body === 'string') {
        // 如果是字符串，直接发送
        res.send(result.data.Body);
      } else if (result.data.Body && typeof result.data.Body.pipe === 'function') {
        // 如果是流，使用 pipe
        result.data.Body.pipe(res);
      } else {
        console.error('Unexpected response type:', typeof result.data.Body);
        res.status(500).json({ message: 'Unexpected response type' });
      }
    } else {
      res.status(500).json({ message: result.msg });
    }
  } catch (error) {
    console.error('Stream file error:', error);
    res.status(500).json({ message: error.msg || 'Internal server error' });
  }
}

// 统一的删除函数
export async function deleteFromCOS(cloudPath) {
  console.log('Deleting file from COS:');

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
          console.log('COS deleteObject success:');
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