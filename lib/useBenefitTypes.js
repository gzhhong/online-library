import { useState, useEffect } from 'react';

// 全局缓存
let benefitTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export function useBenefitTypes() {
  const [benefitTypes, setBenefitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBenefitTypes = async () => {
      // 检查缓存是否有效
      if (benefitTypesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        setBenefitTypes(benefitTypesCache);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/matchlawyer/benefit/benefitgroup/titles');
        if (response.ok) {
          const result = await response.json();
          const types = result.data;
          
          // 更新缓存
          benefitTypesCache = types;
          cacheTimestamp = Date.now();
          
          setBenefitTypes(types);
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

    loadBenefitTypes();
  }, []);

  // 清除缓存的方法
  const clearCache = () => {
    benefitTypesCache = null;
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
        const types = result.data;
        
        // 更新缓存
        benefitTypesCache = types;
        cacheTimestamp = Date.now();
        
        setBenefitTypes(types);
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
    benefitTypes,
    loading,
    error,
    clearCache,
    refresh
  };
} 