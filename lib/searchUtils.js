export function parseSearchText(input) {
    if (!input || !input.trim()) {
        return [];
    }

    // 预处理输入：去掉多余空格和标点符号
    input = input
        .replace(/[，,。．.、:：!！?？;；""''()（）【】\[\]]/g, ' ')  // 将标点符号替换为空格
        .replace(/\s+/g, '')  // 移除所有空格
        .trim();

    const timeRegex = /\d{4}\s*年\s*\d{1,2}\s*月?\s*[-至到]?\s*\d{1,2}\s*月?|\d{4}\s*年\s*\d{1,2}\s*[-至到]\s*\d{1,2}\s*月|最近\s*[一二三四五六七八九十0-9]+\s*(天|周|个月|年)|半年之内|去年|今年|\d+\s*[-至到]\s*\d+\s*(月|年)/g;
    const typeRegex = /(图书|杂志|期刊)/g;
    const accessLevelRegex = /(\d+)\s*级\s*(以[上下])?/;
    const stopwords = [
        '请帮我', '找', '的', '一下', '想要', '查找', '查', '所有',
        '帮我', '看', '查查', '查看', '帮忙', '麻烦', '搜索'
    ];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let result = [];
    let remainingText = input;

    // 预处理：声明所有需要用到的变量
    let timeRangeMatch = null;
    let yearIssueMatch = null;
    let specialTimeMatch = null;
    let relativeTimeMatch = null;

    // 5. 处理年份+期数/月份的组合（移到前面）
    const yearIssueRegex = /(\d{4})年\s*(?:第?\s*)?(\d{1,2})\s*(期|月)(?!\s*[-至到])/;  // 添加负向前瞻，确保后面不是范围分隔符
    yearIssueMatch = remainingText.match(yearIssueRegex);
    if (yearIssueMatch) {  // 移除 !simpleMatch 条件，因为这个处理应该优先
        const year = yearIssueMatch[1];
        const issue = parseInt(yearIssueMatch[2], 10);
        result.push({ 
            key: 'time', 
            value: `${year}${String(issue).padStart(2, '0')}`, 
            opt: 'eq' 
        });
        remainingText = remainingText.replace(yearIssueMatch[0], ' ');
        
        // 如果只有年份+期数/月份，直接返回
        if (remainingText.trim().length === 0) {
            return result;
        }
    }

    // 1. 处理时间范围格式
    const timeRangeRegex = /(\d{4})年(\d{1,2})月[-至到](\d{4})年(\d{1,2})月|(\d{4})年(\d{1,2})-(\d{1,2})月/;
    timeRangeMatch = remainingText.match(timeRangeRegex);
    if (timeRangeMatch) {
        // 使用 parseTimeRange 函数处理时间范围
        const [startValue, endValue] = parseTimeRange(remainingText, currentYear);
        result.push({ 
            key: 'time', 
            value: startValue, 
            opt: 'gte' 
        });
        result.push({ 
            key: 'time', 
            value: endValue, 
            opt: 'lte' 
        });
        remainingText = remainingText.replace(timeRangeMatch[0], ' ');
        
        // 如果只有时间范围，直接返回
        if (remainingText.trim().length === 0) {
            return result;
        }
    }

    // 2. 处理单独月份格式
    const monthOnlyRegex = /(\d{1,2})月(?:份)?(?!\s*[-至到])/;  // 匹配"月"或"月份"，但不是范围的一部分
    const monthOnlyMatch = remainingText.match(monthOnlyRegex);
    if (monthOnlyMatch && !timeRangeMatch && !yearIssueMatch) {  // 确保不是其他时间格式的一部分
        const month = parseInt(monthOnlyMatch[1], 10);
        result.push({ 
            key: 'time', 
            value: `${currentYear}${String(month).padStart(2, '0')}`, 
            opt: 'eq' 
        });
        remainingText = remainingText.replace(monthOnlyMatch[0], ' ');
        
        // 如果只有月份，直接返回
        if (remainingText.trim().length === 0) {
            return result;
        }
    }

    // 3. 处理简写格式（年份+期数）
    const simpleFormatRegex = /(\d{4})\s*(\d{1,2})(?!\s*月|\s*年|\s*[-至到])/;  // 修改正则，确保不会匹配到其他格式
    const simpleMatch = remainingText.match(simpleFormatRegex);
    if (simpleMatch) {
        const year = simpleMatch[1];
        const issue = parseInt(simpleMatch[2], 10);
        result.push({ 
            key: 'time', 
            value: `${year}${String(issue).padStart(2, '0')}`, 
            opt: 'eq' 
        });
        remainingText = remainingText.replace(simpleMatch[0], ' ');

        // 清理文本，提取关键词
        remainingText = remainingText
            .replace(new RegExp(stopwords.join('|'), 'g'), ' ')
            .replace(/\s+/g, '')
            .trim();

        if (remainingText) {
            result.push({ key: 'keywords', value: remainingText, opt: 'eq' });
        }
        
        return result;  // 直接返回结果，避免进一步处理
    }

    // 0. 处理期数格式（包括带关键词的情况）
    const issueRegex = /第?\s*(\d{1,2})\s*期/;  // 移除 ^ 和 $ 以允许其他内容
    const issueMatch = remainingText.match(issueRegex);
    if (issueMatch && !/\d{4}\s*年/.test(remainingText)) {  // 确保不是年份+期数的组合
        const issue = parseInt(issueMatch[1], 10);
        result.push({ 
            key: 'time', 
            value: `${currentYear}${String(issue).padStart(2, '0')}`, 
            opt: 'eq' 
        });
        remainingText = remainingText.replace(issueMatch[0], ' ');
        
        // 如果只有期数，直接返回
        if (remainingText.trim().length === 0) {
            return result;
        }
    }

    // 1. 处理特殊时间词（去年、今年）
    const specialTimeRegex = /(去年|今年)/;
    specialTimeMatch = remainingText.match(specialTimeRegex);
    if (specialTimeMatch) {
        const year = specialTimeMatch[1] === '去年' ? currentYear - 1 : currentYear;
        result.push({ 
            key: 'time', 
            value: `${year}01`, 
            opt: 'gte' 
        });
        result.push({ 
            key: 'time', 
            value: `${year}12`, 
            opt: 'lte' 
        });
        remainingText = remainingText.replace(specialTimeMatch[0], ' ');
        
        // 如果只有特殊时间词，直接返回
        if (remainingText.trim().length === 0) {
            return result;
        }
    }

    // 1. 处理相对时间格式
    const relativeTimeRegex = /最近\s*[一二三四五六七八九十0-9]+\s*(天|周|个月|年)|半年之内/;
    relativeTimeMatch = remainingText.match(relativeTimeRegex);
    if (relativeTimeMatch) {
        if (relativeTimeMatch[0] === '半年之内') {
            let targetMonth = currentMonth - 6;
            let targetYear = currentYear;
            if (targetMonth <= 0) {
                targetMonth += 12;
                targetYear -= 1;
            }
            result.push({ 
                key: 'time', 
                value: `${targetYear}${String(targetMonth).padStart(2, '0')}`, 
                opt: 'gte' 
            });
            remainingText = remainingText.replace(relativeTimeMatch[0], ' ');
        } else {
            const timeResults = handleRelativeTime(relativeTimeMatch[0], currentYear, currentMonth);
            result.push(...timeResults);
            remainingText = remainingText.replace(relativeTimeMatch[0], ' ');
        }
    }

    // 2. 提取类型信息（移到相对时间处理之后）
    const typeMatches = remainingText.match(typeRegex) || [];
    if (typeMatches.length > 0) {
        result.push({ key: 'type', value: typeMatches[0], opt: 'eq' });
        remainingText = remainingText.replace(typeMatches[0], ' ');
    }

    // 如果只有相对时间和类型，直接返回
    if (remainingText.trim().length === 0) {
        return result;
    }

    // 6. 处理纯年份格式（如果没有匹配到其他时间格式）
    if (!yearIssueMatch && !timeRangeMatch && !specialTimeMatch && !relativeTimeMatch) {
        const yearRegex = /(\d{4})年?(?!\s*\d+\s*(月|期))/;
        const yearMatch = remainingText.match(yearRegex);
        if (yearMatch) {
            const year = yearMatch[1];
            result.push({ key: 'time', value: `${year}01`, opt: 'gte' });
            result.push({ key: 'time', value: `${year}12`, opt: 'lte' });
            remainingText = remainingText.replace(yearMatch[0], ' ');
            
            // 如果只有年份，直接返回
            if (remainingText.trim().length === 0) {
                return result;
            }
        }
    }

    // 7. 提取访问权限信息
    const accessLevelMatch = remainingText.match(accessLevelRegex);
    if (accessLevelMatch) {
        const level = parseInt(accessLevelMatch[1], 10);
        const modifier = accessLevelMatch[2];
        result.push({
            key: 'accessLevel',
            value: level,
            opt: modifier === '以上' ? 'gte' : modifier === '以下' ? 'lte' : 'eq'
        });
        remainingText = remainingText.replace(accessLevelMatch[0], ' ');
    }

    // 8. 清理文本，提取关键词
    remainingText = remainingText
        .replace(new RegExp(stopwords.join('|'), 'g'), ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (remainingText) {
        result.push({ key: 'keywords', value: remainingText, opt: 'eq' });
    }

    // 如果没有提取到任何条件，且输入不为空，返回错误
    if (result.length === 0 && input.trim()) {
        return { error: '未能解析有效的查询条件，请提供更明确的信息。' };
    }

    return result;
}
  
  // 相对时间处理
  function handleRelativeTime(match, currentYear, currentMonth) {
    const results = [];
    const relativeTimeRegex = /最近\s*([一二三四五六七八九十0-9]+)\s*(天|周|个月|年)/;
    const matchParts = match.match(relativeTimeRegex);

    if (matchParts) {
        const numStr = matchParts[1].replace(/[一二三四五六七八九十]/g, n => 
            '一二三四五六七八九十'.indexOf(n) + 1);
        const value = parseInt(numStr, 10);
        const unit = matchParts[2];

        const now = new Date();
        let targetDate = new Date(now);  // 使用完整的当前时间
        
        if (unit === '年') {
            targetDate.setFullYear(targetDate.getFullYear() - value);
        } else if (unit === '个月') {
            targetDate.setMonth(targetDate.getMonth() - value);
        } else if (unit === '周') {
            targetDate.setDate(targetDate.getDate() - value * 7);
        } else if (unit === '天') {
            targetDate.setDate(targetDate.getDate() - value);
        }

        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth() + 1;

        results.push({ 
            key: 'time', 
            value: `${targetYear}${String(targetMonth).padStart(2, '0')}`, 
            opt: 'gte' 
        });
        results.push({ 
            key: 'time', 
            value: `${currentYear}${String(currentMonth).padStart(2, '0')}`, 
            opt: 'lte' 
        });
    }
    return results;
  }
  
  // 解析时间范围
  function parseTimeRange(rangeParts, currentYear) {
    // 如果输入是单个字符串，先按分隔符分割
    if (typeof rangeParts === 'string') {
        // 提取年份（如果存在）
        const yearMatch = rangeParts.match(/(\d{4})年/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;
        
        // 分割范围部分
        rangeParts = rangeParts.split(/[-至到]/);
        
        // 解析月份
        const [startPart, endPart] = rangeParts;
        const [, startMonth] = parseYearMonth(startPart);
        const [, endMonth] = parseYearMonth(endPart);

        return [
            `${year}${String(startMonth).padStart(2, '0')}`,
            `${year}${String(endMonth).padStart(2, '0')}`
        ];
    }

    const [startPart, endPart] = rangeParts;
    let [startYear, startMonth] = parseYearMonth(startPart);
    let [endYear, endMonth] = parseYearMonth(endPart);

    // 如果没有年份，使用当前年份
    startYear = startYear || currentYear;
    endYear = endYear || startYear;  // 如果结束年份不存在，使用开始年份
    
    // 确保月份存在且是两位数
    startMonth = startMonth ? String(startMonth).padStart(2, '0') : '01';
    endMonth = endMonth ? String(endMonth).padStart(2, '0') : '12';

    return [
        `${startYear}${startMonth}`,
        `${endYear}${endMonth}`
    ];
  }
  
  // 解析年份和月份
  function parseYearMonth(input) {
    // 处理 "2024年1月" 格式
    const fullMatch = input.match(/(\d{4})年\s*(\d{1,2})月/);
    if (fullMatch) {
        return [parseInt(fullMatch[1], 10), parseInt(fullMatch[2], 10)];
    }

    // 处理单独的年份
    const yearMatch = input.match(/(\d{4})年/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

    // 处理单独的月份
    const monthMatch = input.match(/(\d{1,2})月/);
    const month = monthMatch ? parseInt(monthMatch[1], 10) : null;

    // 处理纯数字（可能是月份）
    if (!year && !month) {
        const numMatch = input.match(/(\d{1,2})/);
        if (numMatch) {
            return [null, parseInt(numMatch[1], 10)];
        }
    }

    return [year, month];
  }
  
  // 清理文本
  function cleanText(input, patterns) {
    patterns.forEach(pattern => {
        if (pattern) {
            input = input.replace(pattern, ' ');  // 替换为空格而不是空字符串
        }
    });
    return input
        .replace(/\s+/g, ' ')  // 合并多个空格
        .trim();
  }
  