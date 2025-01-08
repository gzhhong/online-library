/**
 * 解析搜索文本，提取年份、期数、访问权限和关键词
 * @param {string} text - 搜索文本
 * @returns {Object} - 包含year、issue、accessLevel和keyword的对象
 */
export const parseSearchText = (text) => {
    const result = {
        year: null,
        issue: null,
        keyword: null,
        accessLevel: null,
        accessLevelOp: null  // 'eq' | 'gte' | 'lte' | null
    };

    if (!text) return result;

    // 移除常见的无关词语
    const ignoredWords = [
        '请', '帮', '我', '搜', '搜索', '查', '查找', '找',
        '想要', '需要', '查询', '一下', '帮忙', '麻烦',
        '所有刊物', '所有期刊', '刊物', '期刊', '杂志', '期刊杂志',
        '的', '帮我', '给我', '要', '索'
    ];
    
    // 移除多余空格并统一中文符号
    let normalizedText = text.trim()
        .replace(/\s+/g, ' ')
        // 移除所有标点符号
        .replace(/[，,。．.、:：!！?？;；""''()（）【】\[\]]/g, '');

    // 移除无关词语
    ignoredWords.forEach(word => {
        normalizedText = normalizedText.replace(new RegExp(word, 'g'), '');
    });
    
    normalizedText = normalizedText.trim();

    // 匹配年份（4位数字 + 可选的"年"字）
    const yearMatch = normalizedText.match(/(\d{4})\s*(年)?/);
    if (yearMatch) {
        result.year = parseInt(yearMatch[1]);
        // 从文本中移除年份部分
        normalizedText = normalizedText.replace(yearMatch[0], '');
    }

    // 匹配期数（"第"可选 + 1-2位数字 + "期"可选）
    let issueMatch = normalizedText.match(/第\s*(\d{1,2})\s*期/);  // 标准格式：第10期
    if (!issueMatch) {
        issueMatch = normalizedText.match(/(\d{1,2})\s*[期月]/);   // 简化格式：10期、10月
    }
    if (!issueMatch && yearMatch) {
        // 如果有年份且前面都没匹配到，尝试匹配单独的数字
        issueMatch = normalizedText.match(/^\s*(\d{1,2})\s/);      // 空格分隔格式：2023 11 意林
    }

    if (issueMatch) {
        // 确保匹配到的不是年份中的数字
        result.issue = parseInt(issueMatch[1]);
        // 从文本中移除期数部分
        normalizedText = normalizedText.replace(issueMatch[0], ' ');
    }

    // 匹配访问权限级别
    const levelPattern = /(\d)[级等](?:(以[上下])|$)/;
    const levelMatch = normalizedText.match(levelPattern);
    if (levelMatch) {
        result.accessLevel = parseInt(levelMatch[1]);
        if (levelMatch[2]) {
            result.accessLevelOp = levelMatch[2] === '以上' ? 'gte' : 'lte';
        } else {
            result.accessLevelOp = 'eq';
        }
        // 从搜索文本中移除匹配到的访问权限部分
        normalizedText = normalizedText.replace(levelPattern, '');
    }

    // 现在可以安全地移除访问权限相关词语
    normalizedText = normalizedText
        .replace(/访问权限|访问级别|级别|权限|级/g, '')
        .trim();

    // 提取关键词（去除年份、期数和访问权限部分）
    let keyword = normalizedText
        .replace(/的/, '')  // 移除"的"字
        .replace(/\s+/g, ' ')  // 规范化空格
        .trim();

    if (keyword) {
        result.keyword = keyword;
    }

    return result;
}; 