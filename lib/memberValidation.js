import { prisma } from '@/lib/db';

// 验证邮箱格式
export function validateEmailFormat(email) {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '邮箱格式无效';
  }
  return null;
}

// 验证手机号格式
export function validatePhoneFormat(phone) {
  if (!phone) return null;
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return '手机号格式无效，请输入11位数字';
  }
  return null;
}

// 验证权益类型
export function validateBenefitType(benefitType) {
  if (!benefitType) return null;
  if (!['免费成员', '一星成员', '二星成员', '三星成员'].includes(benefitType)) {
    return '权益类型无效';
  }
  return null;
}

// 验证成员类型
export function validateMemberType(type) {
  if (!type) return null;
  if (!['企业', '律师'].includes(type)) {
    return '成员类型必须是"企业"或"律师"';
  }
  return null;
}

// 验证文字信息长度
export function validateDescriptionLength(description) {
  if (!description) return null;
  if (description.length > 2000) {
    return '成员文字信息不能超过2000个字符';
  }
  return null;
}

// 验证律师行业标签
export function validateLawyerIndustries(type, industryIds) {
  if (type === '律师') {
    if (!industryIds || !Array.isArray(industryIds) || industryIds.length === 0) {
      return '律师必须选择行业标签';
    }
  }
  return null;
}

// 检查ID是否已存在（新注册时使用）
export async function checkIdNumberExists(idNumber) {
  if (!idNumber) return null;
  
  const existingMember = await prisma.member.findUnique({
    where: { idNumber }
  });

  if (existingMember) {
    return '该ID已存在';
  }
  return null;
}

// 检查邮箱是否已存在（新注册时使用）
export async function checkEmailExists(email) {
  if (!email) return null;
  
  const existingMember = await prisma.member.findFirst({
    where: { email }
  });

  if (existingMember) {
    return '该邮箱已被注册';
  }
  return null;
}

// 检查手机号是否已存在（新注册时使用）
export async function checkPhoneExists(phone) {
  if (!phone) return null;
  
  const existingMember = await prisma.member.findFirst({
    where: { phone }
  });

  if (existingMember) {
    return '该手机号已被注册';
  }
  return null;
}

// 检查邮箱是否被其他成员使用（更新时使用）
export async function checkEmailExistsForUpdate(email, memberId) {
  if (!email) return null;
  
  const existingMember = await prisma.member.findFirst({
    where: { 
      email,
      id: { not: parseInt(memberId) }
    }
  });

  if (existingMember) {
    return '该邮箱已被其他成员注册';
  }
  return null;
}

// 检查手机号是否被其他成员使用（更新时使用）
export async function checkPhoneExistsForUpdate(phone, memberId) {
  if (!phone) return null;
  
  const existingMember = await prisma.member.findFirst({
    where: { 
      phone,
      id: { not: parseInt(memberId) }
    }
  });

  if (existingMember) {
    return '该手机号已被其他成员注册';
  }
  return null;
}

// 验证必填字段
export function validateRequiredFields(fields) {
  const errors = [];
  const requiredFields = {
    type: '成员类型',
    name: '名称',
    idNumber: 'ID',
    benefitType: '权益类型',
    email: '邮箱',
    phone: '手机号'
  };

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!fields[field]) {
      errors.push(`${label}是必填字段`);
    }
  }

  return errors;
}

// 检查成员是否存在
export async function checkMemberExists(memberId) {
  if (!memberId) return '成员ID是必需的';
  
  const existingMember = await prisma.member.findUnique({
    where: { id: parseInt(memberId) }
  });

  if (!existingMember) {
    return '成员不存在';
  }
  return null;
} 