import { useState, useEffect } from 'react';
import MatchLawyerLayout from '../../components/MatchLawyerLayout';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, Edit, CheckCircle, Delete } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [updating, setUpdating] = useState(false);

  // 加载会员列表
  const loadMembers = async () => {
    try {
      const response = await fetch('/api/matchlawyer/members/list');
      if (response.ok) {
        const result = await response.json();
        setMembers(result.data);
      } else {
        toast.error('加载会员列表失败');
      }
    } catch (error) {
      toast.error('加载会员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载行业标签
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

  useEffect(() => {
    loadMembers();
    loadIndustries();
  }, []);

  // 查看会员详情
  const handleViewMember = async (memberId) => {
    try {
      const response = await fetch(`/api/matchlawyer/members/detail?id=${memberId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedMember(result.data);
        setEditMode(false);
        setDialogOpen(true);
      } else {
        toast.error('获取会员详情失败');
      }
    } catch (error) {
      toast.error('获取会员详情失败');
    }
  };

  // 编辑会员
  const handleEditMember = () => {
    setEditMode(true);
  };

  // 保存会员信息
  const handleSaveMember = async () => {
    if (!selectedMember) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('id', selectedMember.id);
      formData.append('benefitType', selectedMember.benefitType);
      formData.append('description', selectedMember.description || '');
      formData.append('email', selectedMember.email);
      formData.append('phone', selectedMember.phone);
      formData.append('isPaid', selectedMember.isPaid.toString());
      formData.append('type', selectedMember.type);
      
      if (selectedMember.company) {
        formData.append('company', selectedMember.company);
      }

      if (selectedMember.type === '律师' && selectedMember.industries) {
        formData.append('industryIds', JSON.stringify(selectedMember.industries.map(i => i.id)));
      }

      const response = await fetch('/api/matchlawyer/members/update', {
        method: 'PUT',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedMember(result.data);
        setEditMode(false);
        loadMembers(); // 重新加载列表
        toast.success('会员信息更新成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setUpdating(false);
    }
  };

  // 审核通过
  const handleApproveMember = async () => {
    if (!selectedMember) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/matchlawyer/members/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedMember.id }),
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedMember(result.data);
        loadMembers(); // 重新加载列表
        toast.success('会员审核通过');
      } else {
        const error = await response.json();
        toast.error(error.error || '审核失败');
      }
    } catch (error) {
      toast.error('审核失败');
    } finally {
      setUpdating(false);
    }
  };

  // 删除会员
  const handleDeleteMember = async (memberId) => {
    if (!confirm('确定要删除这个会员吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/members/delete?id=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadMembers(); // 重新加载列表
        if (selectedMember && selectedMember.id === memberId) {
          setDialogOpen(false);
          setSelectedMember(null);
        }
        toast.success('会员删除成功');
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 获取状态显示
  const getStatusDisplay = (status) => {
    return status === 0 ? (
      <Chip label="待审核" color="warning" size="small" />
    ) : (
      <Chip label="已审核" color="success" size="small" />
    );
  };

  // 获取权益类型显示
  const getBenefitTypeDisplay = (benefitType) => {
    const colors = {
      '免费': 'default',
      '1级会员': 'primary',
      '2级会员': 'secondary',
      '3级会员': 'error'
    };
    return <Chip label={benefitType} color={colors[benefitType] || 'default'} size="small" />;
  };

  // 获取付费状态显示
  const getPaidStatusDisplay = (isPaid, benefitType) => {
    if (benefitType === '免费') return null;
    return isPaid ? (
      <Chip label="已付费" color="success" size="small" />
    ) : (
      <Chip label="未付费" color="error" size="small" />
    );
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

  return (
    <MatchLawyerLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          会员管理
        </Typography>

        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>名称</TableCell>
                  <TableCell>类型</TableCell>
                  <TableCell>权益类型</TableCell>
                  <TableCell>付费状态</TableCell>
                  <TableCell>审核状态</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.type}</TableCell>
                    <TableCell>{getBenefitTypeDisplay(member.benefitType)}</TableCell>
                    <TableCell>{getPaidStatusDisplay(member.isPaid, member.benefitType)}</TableCell>
                    <TableCell>{getStatusDisplay(member.status)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleViewMember(member.id)}
                        color="primary"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteMember(member.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* 详情对话框 */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editMode ? '编辑会员信息' : '会员详情'}
          </DialogTitle>
          <DialogContent>
            {selectedMember && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  {/* 基本信息 */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="名称"
                      value={selectedMember.name}
                      disabled
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="类型"
                      value={selectedMember.type}
                      disabled
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="ID"
                      value={selectedMember.idNumber}
                      disabled
                      margin="normal"
                    />
                    {selectedMember.type === '律师' && (
                      <TextField
                        fullWidth
                        label="工作单位"
                        value={selectedMember.company || ''}
                        onChange={(e) => setSelectedMember({
                          ...selectedMember,
                          company: e.target.value
                        })}
                        disabled={!editMode}
                        margin="normal"
                      />
                    )}
                    <FormControl fullWidth margin="normal">
                      <InputLabel>权益类型</InputLabel>
                      <Select
                        value={selectedMember.benefitType}
                        onChange={(e) => setSelectedMember({
                          ...selectedMember,
                          benefitType: e.target.value
                        })}
                        disabled={!editMode}
                      >
                        <MenuItem value="免费">免费</MenuItem>
                        <MenuItem value="1级会员">1级会员</MenuItem>
                        <MenuItem value="2级会员">2级会员</MenuItem>
                        <MenuItem value="3级会员">3级会员</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* 联系信息 */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="邮箱"
                      value={selectedMember.email}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        email: e.target.value
                      })}
                      disabled={!editMode}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="手机号"
                      value={selectedMember.phone}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        phone: e.target.value
                      })}
                      disabled={!editMode}
                      margin="normal"
                    />
                    {selectedMember.benefitType !== '免费' && (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={selectedMember.isPaid}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              isPaid: e.target.checked
                            })}
                            disabled={!editMode}
                          />
                        }
                        label="已付费"
                        sx={{ mt: 2 }}
                      />
                    )}
                  </Grid>

                  {/* 文字信息 */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="会员文字信息"
                      value={selectedMember.description || ''}
                      onChange={(e) => setSelectedMember({
                        ...selectedMember,
                        description: e.target.value
                      })}
                      disabled={!editMode}
                      multiline
                      rows={4}
                      margin="normal"
                    />
                  </Grid>

                  {/* 行业标签（仅律师） */}
                  {selectedMember.type === '律师' && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        行业标签
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedMember.industries.map((industry) => (
                          <Chip
                            key={industry.id}
                            label={industry.title}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {/* 图片 */}
                  {selectedMember.images && selectedMember.images.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        会员图片
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {selectedMember.images.map((image, index) => (
                          <Card key={index} sx={{ width: 200 }}>
                            <CardMedia
                              component="img"
                              height="140"
                              image={image}
                              alt={`图片 ${index + 1}`}
                            />
                            <CardContent>
                              <Typography variant="body2" color="text.secondary">
                                图片 {index + 1}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </Box>
                    </Grid>
                  )}

                                     {/* 状态信息 */}
                   <Grid item xs={12}>
                     <Alert severity="info">
                       创建时间: {new Date(selectedMember.createdAt).toLocaleString()}
                       {selectedMember.updatedAt !== selectedMember.createdAt && (
                         <>
                           <br />
                           更新时间: {new Date(selectedMember.updatedAt).toLocaleString()}
                         </>
                       )}
                     </Alert>
                   </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {editMode ? (
              <>
                <Button
                  onClick={handleSaveMember}
                  variant="contained"
                  disabled={updating}
                >
                  {updating ? <CircularProgress size={20} /> : '保存'}
                </Button>
                <Button
                  onClick={() => setEditMode(false)}
                  disabled={updating}
                >
                  取消
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleEditMember}
                  variant="outlined"
                  startIcon={<Edit />}
                >
                  编辑
                </Button>
                {selectedMember && selectedMember.status === 0 && (
                  <Button
                    onClick={handleApproveMember}
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    disabled={updating}
                  >
                    {updating ? <CircularProgress size={20} /> : '通过审核'}
                  </Button>
                )}
                <Button
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  disabled={updating}
                >
                  {updating ? <CircularProgress size={20} /> : '删除会员'}
                </Button>
                <Button
                  onClick={() => setDialogOpen(false)}
                >
                  关闭
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MatchLawyerLayout>
  );
}
