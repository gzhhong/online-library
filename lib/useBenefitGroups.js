import { useState, useEffect } from 'react';

// 全局缓存
let benefitGroupsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export function useBenefitGroups() {
  const [benefitGroups, setBenefitGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBenefitGroups = async () => {
      // 检查缓存是否有效
      if (benefitGroupsCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        setBenefitGroups(benefitGroupsCache);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/matchlawyer/benefit/benefitgroup/titles');
        if (response.ok) {
          const result = await response.json();
          const groups = result.data;
          
          // 更新缓存
          benefitGroupsCache = groups;
          cacheTimestamp = Date.now();
          
          setBenefitGroups(groups);
        } else {
          throw new Error('加载权益类型失败');
        }
      } catch (err) {
        console.error('加载权益类型失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBenefitGroups();
  }, []);

  // 清除缓存的方法
  const clearCache = () => {
    benefitGroupsCache = null;
    cacheTimestamp = null;
  };

  // 刷新数据的方法
  const refresh = async () => {
    clearCache();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/titles');
      if (response.ok) {
        const result = await response.json();
        const groups = result.data;
        
        // 更新缓存
        benefitGroupsCache = groups;
        cacheTimestamp = Date.now();
        
        setbenefitGroups(groups);
      } else {
        throw new Error('加载权益类型失败');
      }
    } catch (err) {
      console.error('加载权益类型失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    benefitGroups,
    loading,
    error,
    clearCache,
    refresh
  };
} 