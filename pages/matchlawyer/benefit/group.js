import { useState, useEffect } from 'react';
import MatchLawyerLayout from '../../../components/MatchLawyerLayout';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { Edit, Save, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function BenefitGroupPage() {
  const [benefitGroups, setBenefitGroups] = useState([]);
  const [benefitTypes, setBenefitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newGroup, setNewGroup] = useState({
    title: '',
    benefitTypeId: '',
    times: 1,
    description: '',
    price: 0,
    notShow: false
  });

  // 加载权益分组列表
  const loadBenefitGroups = async () => {
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/list');
      if (response.ok) {
        const result = await response.json();
        setBenefitGroups(result.data);
      } else {
        toast.error('加载权益分组列表失败');
      }
    } catch (error) {
      toast.error('加载权益分组列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载权益类型列表
  const loadBenefitTypes = async () => {
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefittype/list');
      if (response.ok) {
        const result = await response.json();
        setBenefitTypes(result.data);
      }
    } catch (error) {
      console.error('加载权益类型失败:', error);
    }
  };

  useEffect(() => {
    loadBenefitGroups();
    loadBenefitTypes();
  }, []);

  // 开始编辑
  const handleEdit = (item) => {
    setEditingId(item.id);
  };

  // 保存编辑
  const handleSave = async (item) => {
    setSaving(true);
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        toast.success('权益分组更新成功');
        setEditingId(null);
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除权益分组
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个权益项吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/benefit/benefitgroup/delete?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('权益分组删除成功');
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 添加新权益组
  const handleAddGroup = async () => {
    if (!newGroup.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (!newGroup.benefitTypeId) {
      toast.error('请选择权益类型');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        toast.success('权益分组创建成功');
        setNewGroup({
          title: '',
          benefitTypeId: '',
          times: 1,
          description: '',
          price: 0,
          notShow: false
        });
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '创建失败');
      }
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加权益项到现有组
  const handleAddItem = async (groupId, title) => {
    if (!newGroup.benefitTypeId) {
      toast.error('请选择权益类型');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/addItem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newGroup,
          groupId,
          title
        }),
      });

      if (response.ok) {
        toast.success('权益项添加成功');
        setNewGroup({
          title: '',
          benefitTypeId: '',
          times: 1,
          description: '',
          price: 0,
          notShow: false
        });
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '添加失败');
      }
    } catch (error) {
      toast.error('添加失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新编辑中的权益分组
  const updateEditingBenefitGroup = (groupId, itemId, field, value) => {
    setBenefitGroups(prev => prev.map(group => {
      if (group.groupId === groupId) {
        return {
          ...group,
          items: group.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
          )
        };
      }
      return group;
    }));
  };

  // 更新新组数据
  const updateNewGroup = (field, value) => {
    setNewGroup(prev => ({ ...prev, [field]: value }));
  };

  return (
    <MatchLawyerLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          权益分组管理
        </Typography>

        {/* 添加新权益组 */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            增加权益组
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="标题"
                value={newGroup.title}
                onChange={(e) => updateNewGroup('title', e.target.value)}
                placeholder="如：免费成员"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>权益类型</InputLabel>
                <Select
                  value={newGroup.benefitTypeId}
                  onChange={(e) => updateNewGroup('benefitTypeId', e.target.value)}
                  label="权益类型"
                >
                  {benefitTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.title} {type.isPaid ? '(收费)' : '(免费)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="次数"
                type="number"
                value={newGroup.times}
                onChange={(e) => updateNewGroup('times', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 999 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="价格"
                type="number"
                value={newGroup.price}
                onChange={(e) => updateNewGroup('price', parseFloat(e.target.value) || 0)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleAddGroup}
                disabled={saving || !newGroup.title.trim() || !newGroup.benefitTypeId}
                startIcon={saving ? <CircularProgress size={20} /> : <Add />}
                fullWidth
              >
                增加权益组
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <div>
            {benefitGroups.map((group, groupIndex) => (
              <Paper key={group.groupId} elevation={3} sx={{ mb: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      权益组：{group.title}
                    </Typography>
                    
                    {group.items.map((item, itemIndex) => (
                      <Box key={item.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={3}>
                            {editingId === item.id ? (
                              <TextField
                                fullWidth
                                size="small"
                                value={item.title}
                                onChange={(e) => updateEditingBenefitGroup(group.groupId, item.id, 'title', e.target.value)}
                              />
                            ) : (
                              <Typography>{item.title}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={3}>
                            {editingId === item.id ? (
                              <FormControl fullWidth size="small">
                                <Select
                                  value={item.benefitTypeId}
                                  onChange={(e) => updateEditingBenefitGroup(group.groupId, item.id, 'benefitTypeId', e.target.value)}
                                >
                                  {benefitTypes.map((type) => (
                                    <MenuItem key={type.id} value={type.id}>
                                      {type.title} {type.isPaid ? '(收费)' : '(免费)'}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <Typography>{item.benefitTypeTitle} {item.benefitTypeIsPaid ? '(收费)' : '(免费)'}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={2}>
                            {editingId === item.id ? (
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={item.times}
                                onChange={(e) => updateEditingBenefitGroup(group.groupId, item.id, 'times', parseInt(e.target.value) || 1)}
                                inputProps={{ min: 1, max: 999 }}
                              />
                            ) : (
                              <Typography>{item.times}次</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={2}>
                            {editingId === item.id ? (
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                value={item.price || 0}
                                onChange={(e) => updateEditingBenefitGroup(group.groupId, item.id, 'price', parseFloat(e.target.value) || 0)}
                                inputProps={{ min: 0, step: 0.01 }}
                              />
                            ) : (
                              <Typography>¥{item.price || 0}</Typography>
                            )}
                          </Grid>
                          <Grid item xs={12} md={2}>
                            <Box display="flex" gap={1}>
                              {editingId === item.id ? (
                                <IconButton
                                  onClick={() => handleSave(item)}
                                  disabled={saving}
                                  color="primary"
                                  size="small"
                                >
                                  {saving ? <CircularProgress size={20} /> : <Save />}
                                </IconButton>
                              ) : (
                                <IconButton
                                  onClick={() => handleEdit(item)}
                                  color="primary"
                                  size="small"
                                >
                                  <Edit />
                                </IconButton>
                              )}
                              <IconButton
                                onClick={() => handleDelete(item.id)}
                                color="error"
                                size="small"
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </Grid>
                        </Grid>
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            描述：{item.description}
                          </Typography>
                        )}
                      </Box>
                    ))}

                    {/* 为当前组添加权益项 */}
                    <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        为当前组添加权益项
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth size="small">
                            <InputLabel>权益类型</InputLabel>
                            <Select
                              value={newGroup.benefitTypeId}
                              onChange={(e) => updateNewGroup('benefitTypeId', e.target.value)}
                              label="权益类型"
                            >
                              {benefitTypes.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                  {type.title} {type.isPaid ? '(收费)' : '(免费)'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="次数"
                            type="number"
                            value={newGroup.times}
                            onChange={(e) => updateNewGroup('times', parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 999 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="价格"
                            type="number"
                            value={newGroup.price}
                            onChange={(e) => updateNewGroup('price', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleAddItem(group.groupId, group.title)}
                            disabled={saving || !newGroup.benefitTypeId}
                            startIcon={saving ? <CircularProgress size={16} /> : <Add />}
                          >
                            增加权益项
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
                {groupIndex < benefitGroups.length - 1 && <Divider />}
              </Paper>
            ))}
          </div>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          提示：每个权益组可以包含多个权益项，编辑任何权益项的标题都会同步更新同组其他权益项的标题。
        </Alert>
      </Box>
    </MatchLawyerLayout>
  );
} 