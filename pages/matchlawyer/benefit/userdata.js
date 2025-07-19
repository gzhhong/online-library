import { useState, useEffect } from 'react';
import MatchLawyerLayout from '../../../components/MatchLawyerLayout';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { toast } from 'react-hot-toast';

export default function BenefitConsumptionPage() {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载权益使用情况
  const loadConsumptionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matchlawyer/benefit/consumed/list');
      if (response.ok) {
        const result = await response.json();
        setConsumptionData(result.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '加载权益使用情况失败');
      }
    } catch (error) {
      console.error('加载权益使用情况失败:', error);
      setError(error.message);
      toast.error('加载权益使用情况失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumptionData();
  }, []);

  // 获取权益状态显示
  const getBenefitStatusDisplay = (benefit) => {
    const isExhausted = benefit.remainingCount === 0;
    const isLow = benefit.remainingCount <= Math.ceil(benefit.totalAllowed * 0.2);
    const usagePercentage = benefit.totalAllowed > 0 ? (benefit.usedCount / benefit.totalAllowed) * 100 : 0;
    
    let color = 'success';
    if (isExhausted) {
      color = 'error';
    } else if (isLow) {
      color = 'warning';
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {benefit.benefitTitle}
          {benefit.benefitIsPaid && (
            <Chip 
              label="付费" 
              size="small" 
              color="primary" 
              sx={{ ml: 1, height: 20 }}
            />
          )}
        </Typography>
        
        {/* 使用进度条 */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            使用进度: {benefit.usedCount}/{benefit.totalAllowed} ({usagePercentage.toFixed(1)}%)
          </Typography>
          <Box 
            sx={{ 
              width: '100%', 
              height: 4, 
              bgcolor: 'grey.200', 
              borderRadius: 2,
              mt: 0.5,
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                width: `${Math.min(usagePercentage, 100)}%`, 
                height: '100%', 
                bgcolor: isExhausted ? 'error.main' : isLow ? 'warning.main' : 'success.main',
                transition: 'width 0.3s ease'
              }} 
            />
          </Box>
        </Box>

        {/* 剩余次数显示 */}
        <Tooltip title={`总次数: ${benefit.totalAllowed} | 已用: ${benefit.usedCount} | 剩余: ${benefit.remainingCount}`}>
          <Chip 
            label={`剩余: ${benefit.remainingCount} 次`}
            color={color}
            size="small"
            variant={isExhausted ? "filled" : "outlined"}
            sx={{ 
              fontWeight: 'bold',
              fontSize: '0.75rem',
              height: 24
            }}
          />
        </Tooltip>
      </Box>
    );
  };

  // 获取用户类型显示
  const getMemberTypeDisplay = (type) => {
    const color = type === '律师' ? 'primary' : 'secondary';
    return <Chip label={type} color={color} size="small" />;
  };

  // 获取权益类型显示
  const getBenefitTypeDisplay = (benefitType) => {
    const colors = ['default', 'primary', 'secondary', 'error', 'warning', 'info'];
    const index = benefitType.length % colors.length;
    const color = colors[index];
    return <Chip label={benefitType} color={color} size="small" />;
  };

  if (loading) {
    return (
      <MatchLawyerLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MatchLawyerLayout>
    );
  }

  if (error) {
    return (
      <MatchLawyerLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Box>
      </MatchLawyerLayout>
    );
  }

  return (
    <MatchLawyerLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          权益使用情况
        </Typography>

        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>用户ID</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>权益类型</TableCell>
                  <TableCell>权益一</TableCell>
                  <TableCell>权益二</TableCell>
                  <TableCell>权益三</TableCell>
                  <TableCell>权益四</TableCell>
                  <TableCell>权益五</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumptionData.map((user) => (
                  <TableRow key={user.memberId}>
                    <TableCell>{user.memberId}</TableCell>
                    <TableCell>{user.memberName}</TableCell>
                    <TableCell>{getMemberTypeDisplay(user.memberType)}</TableCell>
                    <TableCell>{getBenefitTypeDisplay(user.benefitType)}</TableCell>
                    {[0, 1, 2, 3, 4].map((index) => (
                      <TableCell key={index}>
                        {user.benefits[index] ? (
                          getBenefitStatusDisplay(user.benefits[index])
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {consumptionData.length === 0 && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              暂无权益使用记录
            </Typography>
          </Box>
        )}

        {/* 图例说明 */}
        <Paper sx={{ mt: 2, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            图例说明
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="剩余: 5 次" color="success" size="small" variant="outlined" />
              <Typography variant="body2">正常</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="剩余: 2 次" color="warning" size="small" variant="outlined" />
              <Typography variant="body2">剩余不足20%</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="剩余: 0 次" color="error" size="small" variant="filled" />
              <Typography variant="body2">已用完</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="付费" color="primary" size="small" />
              <Typography variant="body2">付费权益</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </MatchLawyerLayout>
  );
} 