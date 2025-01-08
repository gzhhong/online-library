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
        '所有刊物', '所有期刊', '刊物', '期刊'
    ];
    
    // 移除多余空格并统一中文符号
    let normalizedText = text.trim()
        .replace(/\s+/g, ' ')
        .replace('，', ',')
        .replace('：', ':')
        .replace('）', ')')
        .replace('（', '(');

    // 移除无关词语
    ignoredWords.forEach(word => {
        normalizedText = normalizedText.replace(new RegExp(word, 'g'), '');
    });
    
    normalizedText = normalizedText.trim();

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

    // 匹配年份（4位数字 + 可选的"年"字）
    const yearMatch = normalizedText.match(/(\d{4})(年)?/);
    if (yearMatch) {
        result.year = parseInt(yearMatch[1]);
    }

    // 匹配期数（"第"可选 + 1-2位数字 + "期"可选）
    const issueMatch = normalizedText.match(/(第)?(\d{1,2})(期)?/);
    if (issueMatch && (!yearMatch || issueMatch.index > yearMatch.index)) {
        // 确保匹配到的不是年份中的数字
        result.issue = parseInt(issueMatch[2]);
    }

    // 提取关键词（去除年份、期数和访问权限部分）
    let keyword = normalizedText
        .replace(/(\d{4})(年)?/, '') // 移除年份
        .replace(/(第)?(\d{1,2})(期)?/, '') // 移除期数
        .trim();

    if (keyword) {
        result.keyword = keyword;
    }

    return result;
}; 