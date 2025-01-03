import COS from 'cos-nodejs-sdk-v5';
import request from 'request';

// COS配置
export const cosConfig = {
  Bucket: process.env.COS_BUCKET,
  Region: 'ap-shanghai'
};

// 初始化COS SDK
export async function initCOS() {
  return new COS({
    getAuthorization: async function (options, callback) {
      try {
        const res = await new Promise((resolve, reject) => {
          request({
            url: 'http://api.weixin.qq.com/_/cos/getauth',
            method: 'GET',
          }, function(err, response) {
            if (err) reject(err);
            resolve(response.body);
          });
        });
        
        const info = JSON.parse(res);
        callback({
          TmpSecretId: info.TmpSecretId,
          TmpSecretKey: info.TmpSecretKey,
          SecurityToken: info.Token,
          ExpiredTime: info.ExpiredTime,
        });
      } catch (e) {
        console.error('获取临时密钥失败:', e);
        callback(null);
      }
    },
  });
}