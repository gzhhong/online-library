import { useState, useEffect } from 'react';
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    type: '企业',
    name: '',
    idNumber: '',
    benefitType: '免费',
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

    // 客户端验证
    const errors = [];
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.push('邮箱格式不正确');
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.push('手机号格式不正确，请输入11位数字');
    }
    
    // 验证文字信息长度
    if (formData.description && formData.description.length > 2000) {
      errors.push('会员文字信息不能超过2000个字符');
    }
    
    // 验证律师必须选择行业标签
    if (formData.type === '律师' && selectedIndustries.length === 0) {
      errors.push('律师必须选择行业标签');
    }
    
    // 如果有验证错误，显示错误并停止提交
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      setSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('type', formData.type);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('idNumber', formData.idNumber);
      formDataToSend.append('benefitType', formData.benefitType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);

      if (formData.type === '律师') {
        if (selectedIndustries.length > 0) {
          formDataToSend.append('industryIds', JSON.stringify(selectedIndustries));
        }
        if (formData.company) {
          formDataToSend.append('company', formData.company);
        }
      }

      // 添加图片文件
      selectedImages.forEach((image, index) => {
        formDataToSend.append('images', image);
      });

      const response = await fetch('/api/matchlawyer/members/register', {
        method: 'POST',
        body: formDataToSend
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
          benefitType: '免费',
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
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      p: 2
    }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          会员注册
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          注册后需要等待管理员审核，审核通过后即可成为正式会员。
        </Alert>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>会员类型</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  label="会员类型"
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
                  value={formData.benefitType}
                  onChange={(e) => setFormData({...formData, benefitType: e.target.value})}
                  label="权益类型"
                >
                  <MenuItem value="免费">免费</MenuItem>
                  <MenuItem value="1级会员">1级会员</MenuItem>
                  <MenuItem value="2级会员">2级会员</MenuItem>
                  <MenuItem value="3级会员">3级会员</MenuItem>
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
                error={formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)}
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
                error={formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)}
                helperText={formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone) ? '请输入11位手机号码' : ''}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="会员文字信息"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                error={formData.description && formData.description.length > 2000}
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
  );
} 