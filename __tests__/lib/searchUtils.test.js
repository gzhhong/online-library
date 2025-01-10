import { parseSearchText } from '@/lib/searchUtils';

// 在所有测试之前定义自定义匹配器
expect.extend({
    toEqualExactlyOnce(received, expected) {
        const pass = received.length === expected.length &&
            expected.every(exp => 
                received.filter(rec => 
                    JSON.stringify(rec) === JSON.stringify(exp)
                ).length === 1
            );

        return {
            pass,
            message: () => pass
                ? 'Expected items not to match exactly once each'
                : 'Expected items to match exactly once each'
        };
    }
});

describe('parseSearchText', () => {
    test('解析基础年份', () => {
        // 完整年份格式
        expect(parseSearchText('2024年')).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'gte' },
            { key: 'time', value: '202412', opt: 'lte' }
        ]);
        
        // 纯数字年份
        expect(parseSearchText('2024')).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'gte' },
            { key: 'time', value: '202412', opt: 'lte' }        
        ]);
        
        // 带有语气词的年份
        expect(parseSearchText('请帮我找2024年的期刊')).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'gte' },
            { key: 'time', value: '202412', opt: 'lte' },
            { key: 'type', value: '期刊', opt: 'eq' }
        ]);
    });

    test('解析基础期数', () => {
        // 标准期数格式
        const now = new Date();
        const currentYear = now.getFullYear();
        expect(parseSearchText('第10期')).toEqual([
            { key: 'time', value: currentYear+""+10, opt: 'eq' }
        ]);
        
        // 简单期数格式
        expect(parseSearchText('10期')).toEqual([
            { key: 'time', value: currentYear+""+10, opt: 'eq' }
        ]);
        
        // 第一期特殊处理
        expect(parseSearchText('第1期')).toEqual([
            { key: 'time', value: currentYear+""+'01', opt: 'eq' }
        ]);
    });

    test('解析组合查询', () => {
        // 年份 + 期数
        expect(parseSearchText('2024年第10期')).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' }
        ]);

        // 年份 + 月份
        console.log('2024年10月实际结果:', JSON.stringify(parseSearchText('2024年10月'), null, 2));
        expect(parseSearchText('2024年10月')).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' }
        ]);

        // 年份 + 关键词
        expect(parseSearchText('2024年意林')).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'gte' },
            { key: 'time', value: '202412', opt: 'lte' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 期数 + 关键词
        expect(parseSearchText('第10期意林')).toEqualExactlyOnce([
            { key: 'time', value: '202510', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);
    });

    test('特殊情况处理', () => {
        // 带空格的输入
        console.log('2024 年 第 10 期 意林实际结果:', JSON.stringify(parseSearchText('2024 年 第 10 期 意林'), null, 2));
        expect(parseSearchText('2024 年 第 10 期 意林')).toEqual([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 年份+期数简写
        console.log('2023 11 意林实际结果:', JSON.stringify(parseSearchText('2023 11 意林'), null, 2));
        expect(parseSearchText('2023 11 意林')).toEqual([
            { key: 'time', value: '202311', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 带标点符号的输入
        expect(parseSearchText('2024年，第10期，意林')).toEqual([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);
    });

    test('解析具体时间', () => {
        expect(parseSearchText('2024年3月')).toEqual([
            { key: 'time', value: '202403', opt: 'eq' }
        ]);
    });

    test('解析时间范围', () => {
        // 同一年内的月份范围
        const result = parseSearchText('2024年1-3月');
        console.log('2024年1-3月实际结果:', JSON.stringify(result, null, 2));
        expect(result).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'gte' },  // 起始年份
            { key: 'time', value: '202403', opt: 'lte' }
        ]);

        // 跨年的月份范围
        const result2 = parseSearchText('2024年5月-2025年1月');
        console.log('2024年5月-2025年1月实际结果:', JSON.stringify(result2, null, 2));
        expect(result2).toEqualExactlyOnce([
            { key: 'time', value: '202405', opt: 'gte' },  // 起始年份
            { key: 'time', value: '202501', opt: 'lte' }  // 结束年份
        ]);
    });

    test('解析相对时间', () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        let currentMonth = now.getMonth() + 1;

        // 测试"最近3个月"
        const result = parseSearchText('最近3个月');
        let expectedMonth = currentMonth - 3;
        let expectedYear = currentYear;
        if (expectedMonth <= 0) {
            expectedMonth += 12;
            expectedYear -= 1;
        }
        if (expectedMonth < 10) {
            expectedMonth = "0"+expectedMonth;
        }
        if (currentMonth < 10) {
            currentMonth = "0"+currentMonth;
        }
        expect(result).toEqualExactlyOnce([
            { key: 'time', value: expectedYear+""+expectedMonth, opt: 'gte' },
            { key: 'time', value: currentYear+""+currentMonth, opt: 'lte' }
        ]);
    });

    test('解析特殊时间词', () => {
        const currentYear = new Date().getFullYear();
        
        expect(parseSearchText('去年的意林')).toEqualExactlyOnce([
            { key: 'time', value: (currentYear - 1)+""+'01', opt: 'gte' },
            { key: 'time', value: (currentYear - 1)+""+'12', opt: 'lte' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        expect(parseSearchText('今年的杂志')).toEqualExactlyOnce([
            { key: 'time', value: currentYear+""+'01', opt: 'gte' },
            { key: 'time', value: currentYear+""+'12', opt: 'lte' },
            { key: 'type', value: '杂志', opt: 'eq' }
        ]);
    });

    test('解析类型', () => {
        expect(parseSearchText('图书')).toContainEqual({
            key: 'type',
            value: '图书',
            opt: 'eq'
        });

        expect(parseSearchText('杂志')).toContainEqual({
            key: 'type',
            value: '杂志',
            opt: 'eq'
        });
    });

    test('解析复合查询', () => {
        const result = parseSearchText('2024年1月的意林杂志');
        expect(result).toEqualExactlyOnce([
            { key: 'time', value: '202401', opt: 'eq' },
            { key: 'type', value: '杂志', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);
    });

    test('处理空输入', () => {
        // 完全空的输入应该返回空数组，表示无过滤条件
        expect(parseSearchText('')).toEqual([]);
        expect(parseSearchText(null)).toEqual([]);
        expect(parseSearchText(undefined)).toEqual([]);
        
        // 只有空格的输入也应该返回空数组
        expect(parseSearchText('   ')).toEqual([]);
    });

    test('处理无效输入', () => {
        // 只有语气词的输入才算无效
        expect(parseSearchText('请帮我找一下')).toEqual({
            error: '未能解析有效的查询条件，请提供更明确的信息。'
        });
        
        expect(parseSearchText('帮我查查看')).toEqual({
            error: '未能解析有效的查询条件，请提供更明确的信息。'
        });
    });

    test('解析半年之内', () => {
        const result = parseSearchText('半年之内的杂志');
        const now = new Date();
        const currentYear = now.getFullYear();
        let targetMonth = now.getMonth() + 1 - 6;
        let targetYear = currentYear;
        if (targetMonth <= 0) {
            targetMonth += 12;
            targetYear -= 1;
        }
        if (targetMonth < 10) {
            targetMonth = "0"+targetMonth;
        }
        expect(result).toEqualExactlyOnce([
            { key: 'time', value: targetYear+""+targetMonth, opt: 'gte' },
            { key: 'type', value: '杂志', opt: 'eq' }
        ]);
    });

    test('解析最近时间', () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        let currentMonth = now.getMonth() + 1;

        // 测试"最近一周"
        const weekResult = parseSearchText('最近一周');
        console.log('最近一周实际结果:', JSON.stringify(weekResult, null, 2));
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - 7);
        let targetMonth = weekDate.getMonth() + 1;
        if (targetMonth < 10) {
            targetMonth = "0"+targetMonth;
        }
        if (currentMonth < 10) {
            currentMonth = "0"+currentMonth;
        }
        console.log('最近一周预期结果:', JSON.stringify([
            { key: 'time', value: weekDate.getFullYear()+""+targetMonth, opt: 'gte' },
            { key: 'time', value: currentYear+""+currentMonth, opt: 'lte' }
        ], null, 2));
        expect(weekResult).toEqualExactlyOnce([
            { key: 'time', value: weekDate.getFullYear()+""+targetMonth, opt: 'gte' },
            { key: 'time', value: currentYear+""+currentMonth, opt: 'lte' }
        ]);

        // 测试"最近30天"
        const daysResult = parseSearchText('最近30天');
        console.log('最近30天实际结果:', JSON.stringify(daysResult, null, 2));
        const monthDate = new Date();
        monthDate.setDate(monthDate.getDate() - 30);
        targetMonth = monthDate.getMonth() + 1;
        if (targetMonth < 10) {
            targetMonth = "0"+targetMonth;
        }
        expect(daysResult).toEqualExactlyOnce([
            { key: 'time', value: monthDate.getFullYear()+""+targetMonth, opt: 'gte' },
            { key: 'time', value: currentYear+""+currentMonth, opt: 'lte' }
        ]);
    });

    test('忽略无关词语', () => {
        expect(parseSearchText('请帮我搜索2024年第10期的意林期刊')).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' },
            { key: 'type', value: '期刊', opt: 'eq' }
        ]);

        expect(parseSearchText('想要查找一下意林杂志')).toEqualExactlyOnce([
            { key: 'keywords', value: '意林', opt: 'eq' },
            { key: 'type', value: '杂志', opt: 'eq' }
        ]);
    });

    test('特殊格式处理', () => {
        // 带空格的输入
        const result1 = parseSearchText('2024 年 第 10 期 意林');
        console.log('特殊格式1实际结果:', JSON.stringify(result1, null, 2));
        expect(result1).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 带标点符号的输入
        const result2 = parseSearchText('2024年，第10期，意林');
        console.log('特殊格式2实际结果:', JSON.stringify(result2, null, 2));
        expect(result2).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 年份+期数简写
        const result3 = parseSearchText('2023 11 意林');
        console.log('特殊格式3实际结果:', JSON.stringify(result3, null, 2));
        expect(result3).toEqualExactlyOnce([
            { key: 'time', value: '202311', opt: 'eq' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);
    });

    test('访问权限相关查询', () => {
        // 权限等级查询
        const result1 = parseSearchText('想要查找一下3级以上的所有期刊');
        console.log('访问权限1实际结果:', JSON.stringify(result1, null, 2));
        expect(result1).toEqualExactlyOnce([
            { key: 'accessLevel', value: 3, opt: 'gte' },
            { key: 'type', value: '期刊', opt: 'eq' }
        ]);

        // 月份+权限组合查询
        const result2 = parseSearchText('10月份2级以上杂志');
        console.log('访问权限2实际结果:', JSON.stringify(result2, null, 2));
        const currentYear = new Date().getFullYear();
        expect(result2).toEqualExactlyOnce([
            { key: 'time', value: currentYear+""+'10', opt: 'eq' },
            { key: 'accessLevel', value: 2, opt: 'gte' },
            { key: 'type', value: '杂志', opt: 'eq' }
        ]);

        // 精确权限等级
        const result3 = parseSearchText('3级期刊');
        console.log('访问权限3实际结果:', JSON.stringify(result3, null, 2));
        expect(result3).toEqualExactlyOnce([
            { key: 'accessLevel', value: 3, opt: 'eq' },
            { key: 'type', value: '期刊', opt: 'eq' }
        ]);

        // 权限范围查询
        const result4 = parseSearchText('2级以下的杂志');
        console.log('访问权限4实际结果:', JSON.stringify(result4, null, 2));
        expect(result4).toEqualExactlyOnce([
            { key: 'accessLevel', value: 2, opt: 'lte' },
            { key: 'type', value: '杂志', opt: 'eq' }
        ]);
    });

    test('复杂组合查询', () => {
        const result1 = parseSearchText('2024年第10期3级以上意林');
        console.log('复杂组合1实际结果:', JSON.stringify(result1, null, 2));
        
        expect(result1).toEqualExactlyOnce([
            { key: 'time', value: '202410', opt: 'eq' },
            { key: 'accessLevel', value: 3, opt: 'gte' },
            { key: 'keywords', value: '意林', opt: 'eq' }
        ]);

        // 时间范围 + 权限范围 + 关键词
        const result2 = parseSearchText('请帮我查找2024年5月-2024年10月的访问权限3以下的读者文摘');
        console.log('复杂组合2实际结果:', JSON.stringify(result2, null, 2));
        
        expect(result2).toEqualExactlyOnce([
            { key: 'time', value: '202405', opt: 'gte' },  // 起始年份
            { key: 'time', value: '202410', opt: 'lte' },   // 结束年份
            { key: 'accessLevel', value: 3, opt: 'lte' },  // 权限范围
            { key: 'keywords', value: '读者文摘', opt: 'eq' }  // 关键词
        ]);
    });
}); 