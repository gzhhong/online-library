import { parseSearchText } from '@/lib/searchUtils';

describe('parseSearchText', () => {
    test('空字符串返回全部为null的结果', () => {
        const result = parseSearchText('');
        expect(result).toEqual({
            year: null,
            issue: null,
            keyword: null,
            accessLevel: null,
            accessLevelOp: null
        });
    });

    test('解析年份', () => {
        expect(parseSearchText('2024年')).toMatchObject({ year: 2024 });
        expect(parseSearchText('2024')).toMatchObject({ year: 2024 });
        expect(parseSearchText('请帮我找2024年的期刊')).toMatchObject({ year: 2024 });
    });

    test('解析期数', () => {
        expect(parseSearchText('第10期')).toMatchObject({ issue: 10 });
        expect(parseSearchText('10期')).toMatchObject({ issue: 10 });
        expect(parseSearchText('第1期')).toMatchObject({ issue: 1 });
    });

    test('解析访问权限级别', () => {
        // 精确匹配
        expect(parseSearchText('2级')).toMatchObject({ 
            accessLevel: 2,
            accessLevelOp: 'eq'
        });
        expect(parseSearchText('访问权限2级')).toMatchObject({ 
            accessLevel: 2,
            accessLevelOp: 'eq'
        });

        // 大于等于
        expect(parseSearchText('3级以上')).toMatchObject({ 
            accessLevel: 3,
            accessLevelOp: 'gte'
        });
        expect(parseSearchText('权限3级以上')).toMatchObject({ 
            accessLevel: 3,
            accessLevelOp: 'gte'
        });

        // 小于等于
        expect(parseSearchText('2级以下')).toMatchObject({ 
            accessLevel: 2,
            accessLevelOp: 'lte'
        });
        expect(parseSearchText('访问级别2级以下')).toMatchObject({ 
            accessLevel: 2,
            accessLevelOp: 'lte'
        });
    });

    test('解析关键词', () => {
        expect(parseSearchText('意林')).toMatchObject({ keyword: '意林' });
        expect(parseSearchText('请帮我找意林')).toMatchObject({ keyword: '意林' });
    });

    test('组合搜索测试', () => {
        // 年份 + 期数
        expect(parseSearchText('2024年第10期')).toMatchObject({
            year: 2024,
            issue: 10
        });
        expect(parseSearchText('2024年10月')).toMatchObject({
            year: 2024,
            issue: 10
        });
        // 年份 + 关键词
        expect(parseSearchText('2024年意林')).toMatchObject({
            year: 2024,
            keyword: '意林'
        });

        // 期数 + 关键词
        expect(parseSearchText('第10期意林')).toMatchObject({
            issue: 10,
            keyword: '意林'
        });

        // 访问权限 + 关键词
        expect(parseSearchText('3级以上意林')).toMatchObject({
            accessLevel: 3,
            accessLevelOp: 'gte',
            keyword: '意林'
        });

        // 年份 + 期数 + 关键词
        expect(parseSearchText('2024年第10期意林')).toMatchObject({
            year: 2024,
            issue: 10,
            keyword: '意林'
        });

        // 年份 + 期数 + 访问权限 + 关键词
        expect(parseSearchText('2024年第10期3级以上意林')).toMatchObject({
            year: 2024,
            issue: 10,
            accessLevel: 3,
            accessLevelOp: 'gte',
            keyword: '意林'
        });

        expect(parseSearchText('2024年第10期3级以上期刊')).toMatchObject({
            year: 2024,
            issue: 10,
            accessLevel: 3,
            accessLevelOp: 'gte'
        });

        expect(parseSearchText('2024年第10期2级杂志')).toMatchObject({
            year: 2024,
            issue: 10,
            accessLevel: 2,
            accessLevelOp: 'eq'
        });

        expect(parseSearchText('2024年2级以上杂志')).toMatchObject({
            year: 2024,
            accessLevel: 2,
            accessLevelOp: 'gte'
        });


        expect(parseSearchText('10月份2级以上杂志')).toMatchObject({
            issue: 10,
            accessLevel: 2,
            accessLevelOp: 'gte'
        });
    });

    test('忽略无关词语', () => {
        expect(parseSearchText('请帮我搜索2024年第10期的意林期刊')).toMatchObject({
            year: 2024,
            issue: 10,
            keyword: '意林'
        });

        expect(parseSearchText('想要查找一下3级以上的所有期刊')).toMatchObject({
            accessLevel: 3,
            accessLevelOp: 'gte'
        });
    });

    test('特殊情况处理', () => {
        // 确保不会把年份中的数字误认为是期数
        expect(parseSearchText('2024')).toMatchObject({
            year: 2024,
            issue: null
        });

        // 处理带空格的输入
        expect(parseSearchText('2024 年 第 10 期 意林')).toMatchObject({
            year: 2024,
            issue: 10,
            keyword: '意林'
        });

        // 处理中英文混合的标点符号
        expect(parseSearchText('2024年，第10期，意林')).toMatchObject({
            year: 2024,
            issue: 10,
            keyword: '意林'
        });
    });
}); 