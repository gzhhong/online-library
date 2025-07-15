import { prisma } from '@/lib/db';

// 生成6位随机大写字符ID
export function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 验证标题
export function validateTitle(title) {
  if (!title) {
    return '标题是必填字段';
  }
  if (title.length > 100) {
    return '标题不能超过100个字符';
  }
  return null;
}

// 验证次数
export function validateTimes(times) {
  if (times && (times < 1 || times > 999)) {
    return '次数必须在1-999之间';
  }
  return null;
}

// 验证价格
export function validatePrice(price) {
  if (price && (price < 0 || price > 999999.99)) {
    return '价格必须在0-999999.99之间';
  }
  return null;
}

// 验证权益类型ID
export function validateBenefitTypeId(benefitTypeId) {
  if (!benefitTypeId) {
    return '权益类型是必填字段';
  }
  return null;
}

// 验证组ID
export function validateGroupId(groupId) {
  if (!groupId) {
    return '组ID是必填字段';
  }
  return null;
}

// 验证记录ID
export function validateRecordId(id) {
  if (!id) {
    return 'ID是必填字段';
  }
  return null;
}

// 检查权益类型是否存在
export async function checkBenefitTypeExists(benefitTypeId) {
  const benefitType = await prisma.benefitType.findUnique({
    where: { id: benefitTypeId }
  });

  if (!benefitType) {
    return '权益类型不存在';
  }
  return null;
}

// 检查权益类型是否已存在（用于创建时）
export async function checkBenefitTypeIdExists(id) {
  const existing = await prisma.benefitType.findUnique({
    where: { id }
  });

  if (existing) {
    return '该ID已存在';
  }
  return null;
}

// 检查权益分组是否存在
export async function checkBenefitGroupExists(id) {
  const existingBenefitGroup = await prisma.benefitGroup.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingBenefitGroup) {
    return '权益分组不存在';
  }
  return null;
}

// 检查权益类型是否已存在（用于创建时）
export async function checkBenefitTypeIdUnique(id) {
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    const testId = generateId();
    const existing = await prisma.benefitType.findUnique({
      where: { id: testId }
    });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    return '无法生成唯一ID，请重试';
  }
  return null;
}

// 检查权益组中是否已存在相同的权益类型
export async function checkBenefitTypeInGroupExists(groupId, benefitTypeId) {
  const existingItem = await prisma.benefitGroup.findFirst({
    where: { 
      groupId,
      benefitTypeId
    }
  });

  if (existingItem) {
    return '该权益组中已存在此权益类型';
  }
  return null;
}

// 验证权益类型创建数据
export function validateBenefitTypeCreate(data) {
  const errors = [];
  
  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  return errors;
}

// 验证权益类型更新数据
export function validateBenefitTypeUpdate(data) {
  const errors = [];
  
  const idError = validateRecordId(data.id);
  if (idError) errors.push(idError);

  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  return errors;
}

// 验证权益分组创建数据
export function validateBenefitGroupCreate(data) {
  const errors = [];
  
  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  const benefitTypeIdError = validateBenefitTypeId(data.benefitTypeId);
  if (benefitTypeIdError) errors.push(benefitTypeIdError);

  const timesError = validateTimes(data.times);
  if (timesError) errors.push(timesError);

  const priceError = validatePrice(data.price);
  if (priceError) errors.push(priceError);

  return errors;
}

// 验证权益分组更新数据
export function validateBenefitGroupUpdate(data) {
  const errors = [];
  
  const idError = validateRecordId(data.id);
  if (idError) errors.push(idError);

  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  const benefitTypeIdError = validateBenefitTypeId(data.benefitTypeId);
  if (benefitTypeIdError) errors.push(benefitTypeIdError);

  const timesError = validateTimes(data.times);
  if (timesError) errors.push(timesError);

  const priceError = validatePrice(data.price);
  if (priceError) errors.push(priceError);

  return errors;
}

// 验证权益项添加数据
export function validateBenefitItemAdd(data) {
  const errors = [];
  
  const groupIdError = validateGroupId(data.groupId);
  if (groupIdError) errors.push(groupIdError);

  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  const benefitTypeIdError = validateBenefitTypeId(data.benefitTypeId);
  if (benefitTypeIdError) errors.push(benefitTypeIdError);

  const timesError = validateTimes(data.times);
  if (timesError) errors.push(timesError);

  const priceError = validatePrice(data.price);
  if (priceError) errors.push(priceError);

  return errors;
} 