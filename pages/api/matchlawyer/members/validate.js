import {
  validateRequiredFields,
  validateMemberType,
  validateBenefitType,
  validateEmailFormat,
  validatePhoneFormat,
  validateDescriptionLength,
  validateLawyerIndustries,
  checkIdNumberExists,
  checkEmailExists,
  checkPhoneExists
} from '@/lib/memberValidation';
import { withAuth } from '@/lib/auth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Member validation handler started');

  try {
    const { 
      type, 
      name, 
      idNumber, 
      benefitGroup, 
      description, 
      email, 
      phone, 
      company, 
      industryIds 
    } = req.body;

    const errors = [];

    // 验证必填字段
    errors.push(...validateRequiredFields({ type, name, idNumber, benefitGroup, email, phone }));

    // 验证各种格式和业务规则
    const validationResults = [
      validateMemberType(type),
      validateBenefitType(benefitGroup),
      validateEmailFormat(email),
      validatePhoneFormat(phone),
      validateDescriptionLength(description),
      validateLawyerIndustries(type, industryIds)
    ];

    // 添加非空错误
    validationResults.forEach(result => {
      if (result) errors.push(result);
    });

    // 检查唯一性（数据库查询）
    const uniquenessChecks = [
      await checkIdNumberExists(idNumber),
      await checkEmailExists(email),
      await checkPhoneExists(phone)
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