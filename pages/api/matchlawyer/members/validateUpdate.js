import {
  validateBenefitType,
  validateEmailFormat,
  validatePhoneFormat,
  validateDescriptionLength,
  checkMemberExists,
  checkEmailExistsForUpdate,
  checkPhoneExistsForUpdate
} from '@/lib/memberValidation';

import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member update validation handler started');

  try {
    const { 
      id,
      benefitGroup, 
      description, 
      email, 
      phone 
    } = req.body;

    const errors = [];

    // 检查成员是否存在
    const memberExistsError = await checkMemberExists(id);
    if (memberExistsError) {
      errors.push(memberExistsError);
    }

    // 验证各种格式和业务规则
    const validationResults = [
      validateBenefitType(benefitGroup),
      validateEmailFormat(email),
      validatePhoneFormat(phone),
      validateDescriptionLength(description)
    ];

    // 添加非空错误
    validationResults.forEach(result => {
      if (result) errors.push(result);
    });

    // 检查唯一性（排除当前成员）
    const uniquenessChecks = [
      await checkEmailExistsForUpdate(email, id),
      await checkPhoneExistsForUpdate(phone, id)
    ];

    // 添加唯一性错误
    uniquenessChecks.forEach(result => {
      if (result) errors.push(result);
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: '验证失败',
        details: errors 
      });
    }

    // 验证通过
    res.status(200).json({ 
      message: '验证通过',
      valid: true 
    });

  } catch (error) {
    console.error('验证错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
} 

export default withAuth(handler, '/matchlawyer/members');