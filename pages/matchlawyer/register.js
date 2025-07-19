import { useState, useEffect } from 'react';
import MatchLawyerLayout from '../../components/MatchLawyerLayout';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { useBenefitGroups } from '../../lib/useBenefitGroups';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    type: '企业',
    name: '',
    idNumber: '',
    benefitGroup: '',
    description: '',
    email: '',
    phone: '',
    company: ''
  });
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 使用自定义hook获取权益类型
  const { benefitGroups, loading: benefitGroupsLoading, error: benefitGroupsError } = useBenefitGroups();
  
  // 根据用户类型过滤权益分组
  const filteredBenefitGroups = benefitGroups.filter(group => group.forWhom === formData.type);

  const MAX_FILE_SIZE = 80 * 1024; // 80KB
  const MAX_IMAGES = 3;

  // 加载行业标签
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await fetch('/api/matchlawyer/industries/list');
        if (response.ok) {
          const result = await response.json();
          setIndustries(result.flat);
        }
      } catch (error) {
        console.error('加载行业标签失败:', error);
      }
    };

    loadIndustries();
  }, []);

  // 设置默认权益类型
  useEffect(() => {
    if (filteredBenefitGroups.length > 0 && !formData.benefitGroup) {
      setFormData(prev => ({ ...prev, benefitGroup: filteredBenefitGroups[0].title }));
    }
  }, [filteredBenefitGroups, formData.benefitGroup]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // 检查文件数量限制
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast.error(`最多只能上传${MAX_IMAGES}张图片`);
      return;
    }

    // 验证每个文件
    for (const file of files) {
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`图片 ${file.name} 超过80KB限制`);
        continue;
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`图片 ${file.name} 格式不支持，只支持 JPG, PNG, GIF`);
        continue;
      }

      // 添加到选中图片列表
      setSelectedImages(prev => [...prev, file]);
    }

    // 重置 input 的值，这样相同的文件也能再次选择
    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. 先进行服务端验证
      const validationData = {
        type: formData.type,
        name: formData.name,
        idNumber: formData.idNumber,
        benefitGroup: formData.benefitGroup,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        company: formData.type === '律师' ? formData.company : null,
        industryIds: formData.type === '律师' && selectedIndustries.length > 0 ? selectedIndustries : []
      };

      const validationResponse = await fetch('/api/matchlawyer/members/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationData),
      });

      if (!validationResponse.ok) {
        const validationResult = await validationResponse.json();
        if (validationResult.details && Array.isArray(validationResult.details)) {
          validationResult.details.forEach(error => toast.error(error));
        } else {
          toast.error(validationResult.error || '验证失败');
        }
        setSubmitting(false);
        return;
      }

      // 2. 验证通过后，开始上传图片
      // 1. 先上传图片到腾讯云
      const imagePaths = [];
      const imageTcpIds = [];
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          // 生成文件路径
          const ext = image.name.split('.').pop();
          const fileName = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const cloudPath = `members/${fileName}`;

          // 获取上传链接
          const uploadRes = await fetch('/api/matchlawyer/members/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: cloudPath }),
          });

          if (!uploadRes.ok) {
            throw new Error('获取图片上传链接失败');
          }

          const uploadData = await uploadRes.json();

          // 上传到腾讯云
          const formData = new FormData();
          formData.append('key', cloudPath);
          formData.append('Signature', uploadData.authorization);
          formData.append('x-cos-security-token', uploadData.token);
          formData.append('x-cos-meta-fileid', uploadData.cos_file_id);
          formData.append('file', image);

          const cosRes = await fetch(uploadData.url, {
            method: 'POST',
            body: formData,
          });

          if (!cosRes.ok) {
            throw new Error('图片上传到腾讯云失败');
          }

          // 保存云存储路径和file_id
          imagePaths.push(`/members/${fileName}`);
          imageTcpIds.push(uploadData.file_id);
        }
      }

      // 2. 调用注册成功API，创建成员记录
      const registerData = {
        type: formData.type,
        name: formData.name,
        idNumber: formData.idNumber,
        benefitGroup: formData.benefitGroup,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        company: formData.type === '律师' ? formData.company : null,
        industryIds: formData.type === '律师' && selectedIndustries.length > 0 ? selectedIndustries : [],
        images: imagePaths,
        imageTcpId: imageTcpIds
      };

      const response = await fetch('/api/matchlawyer/members/registerSuccess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      // 尝试解析响应
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('服务器响应格式错误');
      }

      if (response.ok) {
        toast.success(result.message || '注册成功，等待审核');
        // 重置表单
        setFormData({
          type: '企业',
          name: '',
          idNumber: '',
          benefitGroup: '',
          description: '',
          email: '',
          phone: '',
          company: ''
        });
        setSelectedIndustries([]);
        setSelectedImages([]);
      } else {
        // 处理各种错误状态
        console.error('Registration failed:', {
          status: response.status,
          statusText: response.statusText,
          data: result
        });

        let errorMessage = '注册失败';
        
        if (result && result.error) {
          errorMessage = result.error;
        } else if (response.status === 400) {
          errorMessage = '请求参数错误，请检查输入信息';
        } else if (response.status === 500) {
          errorMessage = '服务器内部错误，请稍后重试';
        } else if (result && result.message) {
          errorMessage = result.message;
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // 处理网络错误或其他异常
      let errorMessage = '注册失败';
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIndustryToggle = (industryId) => {
    setSelectedIndustries(prev => 
      prev.includes(industryId)
        ? prev.filter(id => id !== industryId)
        : [...prev, industryId]
    );
  };

  return (
    <MatchLawyerLayout>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2,
        minHeight: 'calc(100vh - 64px)' // 减去顶部导航栏高度
      }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            成员注册
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            注册后需要等待管理员审核，审核通过后即可成为正式成员。
          </Alert>
          
          {benefitGroupsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              加载权益类型失败: {benefitGroupsError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>成员类型</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  label="成员类型"
                >
                  <MenuItem value="企业">企业</MenuItem>
                  <MenuItem value="律师">律师</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>权益类型</InputLabel>
                <Select
                  value={formData.benefitGroup}
                  onChange={(e) => setFormData({...formData, benefitGroup: e.target.value})}
                  label="权益类型"
                  disabled={benefitGroupsLoading}
                >
                  {benefitGroupsLoading ? (
                    <MenuItem disabled>加载中...</MenuItem>
                  ) : (
                    filteredBenefitGroups.map((group, index) => (
                      <MenuItem key={index} value={group.title}>
                        {group.title}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={formData.type === '企业' ? '企业名称' : '律师姓名'}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={formData.type === '企业' ? '纳税服务号' : '执业资格号'}
                value={formData.idNumber}
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                required
              />
            </Grid>

            {formData.type === '律师' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="工作单位"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="请输入工作单位名称"
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                error={Boolean(formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))}
                helperText={formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? '请输入正确的邮箱格式' : ''}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="手机号"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                error={Boolean(formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone))}
                helperText={formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone) ? '请输入11位手机号码' : ''}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="成员文字信息"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                error={Boolean(formData.description && formData.description.length > 2000)}
                helperText={
                  formData.description && formData.description.length > 2000 
                    ? '文字信息不能超过2000个字符' 
                    : `${formData.description ? formData.description.length : 0}/2000`
                }
              />
            </Grid>

            {/* 图片上传 */}
            <Grid item xs={12}>
              <Box>
                <input
                  accept="image/*"
                  type="file"
                  id="image-files"
                  multiple
                  onChange={handleFileChange}
                  onClick={(e) => { e.target.value = ''; }}
                  style={{ display: 'none' }}
                  disabled={submitting}
                />
                <label htmlFor="image-files">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    disabled={submitting || selectedImages.length >= MAX_IMAGES}
                  >
                    选择图片 ({selectedImages.length}/{MAX_IMAGES})
                  </Button>
                </label>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                  支持 JPG, PNG, GIF 格式，每张图片不超过80KB，最多3张
                </Typography>
                
                {/* 显示已选择的图片 */}
                {selectedImages.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      已选择的图片:
                    </Typography>
                    {selectedImages.map((image, index) => (
                      <Box key={index} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 1,
                        p: 1,
                        border: '1px solid #ddd',
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {image.name} ({(image.size / 1024).toFixed(1)}KB)
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeImage(index)}
                          disabled={submitting}
                        >
                          删除
                        </Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Grid>

            {formData.type === '律师' && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  选择行业标签
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {industries.map((industry) => (
                    <Chip
                      key={industry.id}
                      label={industry.title}
                      onClick={() => handleIndustryToggle(industry.id)}
                      color={selectedIndustries.includes(industry.id) ? 'primary' : 'default'}
                      variant={selectedIndustries.includes(industry.id) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
                {formData.type === '律师' && selectedIndustries.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    律师必须选择至少一个行业标签
                  </Typography>
                )}
                {selectedIndustries.length > 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    已选择 {selectedIndustries.length} 个行业标签
                  </Typography>
                )}
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : '提交注册'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
    </MatchLawyerLayout>
  );
} 