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
    notShow: false
  });
  const [newItem, setNewItem] = useState({
    benefitTypeId: '',
    times: 1,
    description: '',
    price: 0,
    notShow: false
  });
  const [tempGroups, setTempGroups] = useState([]); // 临时组，未保存到数据库
  const [groupFormData, setGroupFormData] = useState({}); // 每个组的独立表单数据

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
        toast.success('权益项删除成功');
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 删除整个权益组
  const handleDeleteGroup = async (groupId, groupTitle) => {
    const group = benefitGroups.find(g => g.groupId === groupId);
    const itemCount = group ? group.items.length : 0;
    
    if (!confirm(`确定要删除整个权益组"${groupTitle}"吗？\n\n该组包含 ${itemCount} 个权益项，删除后将无法恢复！`)) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/benefit/benefitgroup/deleteGroup?groupId=${groupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('权益组删除成功');
        loadBenefitGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 添加新权益组（只在页面状态中创建，不调用API）
  const handleAddGroup = () => {
    if (!newGroup.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    // 生成临时groupId
    const tempGroupId = 'TEMP_' + Date.now();
    
    // 在页面状态中添加新组
    const newTempGroup = {
      groupId: tempGroupId,
      title: newGroup.title,
      notShow: newGroup.notShow,
      price: 0,
      items: [],
      isTemp: true // 标记为临时组
    };
    
    setTempGroups(prev => [...prev, newTempGroup]);
    
    // 清空表单
    setNewGroup({
      title: '',
      notShow: false
    });
    
    toast.success('权益组已创建，请添加权益项并保存');
  };

  // 添加权益项到临时组
  const handleAddItemToTempGroup = async (groupId) => {
    const formData = getGroupFormData(groupId);
    if (!formData.benefitTypeId) {
      toast.error('请选择权益类型');
      return;
    }

    setSaving(true);
    try {
      // 找到临时组
      const tempGroup = tempGroups.find(g => g.groupId === groupId);
      if (!tempGroup) {
        toast.error('临时组不存在');
        return;
      }

      // 直接调用create接口保存权益项
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupTitle: tempGroup.title,
          groupNotShow: tempGroup.notShow,
          benefitTypeId: formData.benefitTypeId,
          times: formData.times,
          description: formData.description,
          price: formData.price,
          notShow: formData.notShow
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('权益项添加成功');
        
        // 删除临时组，因为现在有了正式的组
        setTempGroups(prev => prev.filter(group => group.groupId !== groupId));
        
        // 清空该组的表单数据
        setGroupFormData(prev => {
          const newData = { ...prev };
          delete newData[groupId];
          return newData;
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

  // 添加权益项到现有组
  const handleAddItem = async (groupId, title) => {
    const formData = getGroupFormData(groupId);
    if (!formData.benefitTypeId) {
      toast.error('请选择权益类型');
      return;
    }

    setSaving(true);
    try {
      // 找到现有组的信息
      const existingGroup = benefitGroups.find(g => g.groupId === groupId);
      if (!existingGroup) {
        toast.error('组不存在');
        return;
      }

      // 调用create接口保存权益项，使用现有组的groupId
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupTitle: existingGroup.title,
          groupNotShow: existingGroup.notShow,
          benefitTypeId: formData.benefitTypeId,
          times: formData.times,
          description: formData.description,
          price: formData.price,
          notShow: formData.notShow,
          existingGroupId: groupId // 传递现有组的ID，让服务器使用这个ID而不是生成新的
        }),
      });

      if (response.ok) {
        toast.success('权益项添加成功');
        // 清空该组的表单数据
        setGroupFormData(prev => {
          const newData = { ...prev };
          delete newData[groupId];
          return newData;
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

  // 更新临时组中的权益项
  const updateTempGroupItem = (groupId, itemId, field, value) => {
    setTempGroups(prev => prev.map(group => {
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

  // 更新新权益项数据
  const updateNewItem = (field, value) => {
    setNewItem(prev => ({ ...prev, [field]: value }));
  };

  // 更新特定组的表单数据
  const updateGroupFormData = (groupId, field, value) => {
    setGroupFormData(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value
      }
    }));
  };

  // 获取组表单数据，确保所有字段都有默认值
  const getGroupFormData = (groupId) => {
    const defaultData = {
      benefitTypeId: '',
      times: 1,
      description: '',
      price: 0,
      notShow: false
    };
    
    const groupData = groupFormData[groupId];
    if (!groupData) {
      return defaultData;
    }
    
    return {
      ...defaultData,
      ...groupData
    };
  };

  // 合并所有组（数据库中的组 + 临时组）
  const allGroups = [...benefitGroups, ...tempGroups];

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
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="标题"
                value={newGroup.title}
                onChange={(e) => updateNewGroup('title', e.target.value)}
                placeholder="如：免费成员"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newGroup.notShow}
                    onChange={(e) => updateNewGroup('notShow', e.target.checked)}
                  />
                }
                label="是否隐藏"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleAddGroup}
                disabled={!newGroup.title.trim()}
                startIcon={<Add />}
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
            {allGroups.map((group, groupIndex) => (
              <Paper key={group.groupId} elevation={3} sx={{ mb: 3 }}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        {group.isTemp ? '[临时] ' : ''}权益组：{group.title} (总价：¥{group.price || 0})
                      </Typography>
                      {!group.isTemp && (
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteGroup(group.groupId, group.title)}
                          title="删除整个权益组"
                        >
                          删除组
                        </Button>
                      )}
                    </Box>
                    
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
                              {!item.isTemp && (
                                <IconButton
                                  onClick={() => handleDelete(item.id)}
                                  color="error"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              )}
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
                        {group.isTemp ? '为临时组添加权益项' : '为当前组添加权益项'}
                      </Typography>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>权益类型</InputLabel>
                            <Select
                              value={getGroupFormData(group.groupId).benefitTypeId}
                              onChange={(e) => updateGroupFormData(group.groupId, 'benefitTypeId', e.target.value)}
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
                            value={getGroupFormData(group.groupId).times}
                            onChange={(e) => updateGroupFormData(group.groupId, 'times', parseInt(e.target.value) || 1)}
                            inputProps={{ min: 1, max: 999 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="价格"
                            type="number"
                            value={getGroupFormData(group.groupId).price}
                            onChange={(e) => updateGroupFormData(group.groupId, 'price', parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          {group.isTemp ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleAddItemToTempGroup(group.groupId)}
                              disabled={saving || !getGroupFormData(group.groupId).benefitTypeId}
                              startIcon={saving ? <CircularProgress size={16} /> : <Add />}
                            >
                              添加到权益组
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleAddItem(group.groupId, group.title)}
                              disabled={saving || !getGroupFormData(group.groupId).benefitTypeId}
                              startIcon={saving ? <CircularProgress size={16} /> : <Add />}
                            >
                              增加权益项
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
                {groupIndex < allGroups.length - 1 && <Divider />}
              </Paper>
            ))}
          </div>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          提示：点击"增加权益组"创建临时组，然后点击"添加到权益组"将权益项保存到数据库并创建正式组。编辑权益项时点击保存按钮更新数据。
        </Alert>
      </Box>
    </MatchLawyerLayout>
  );
} 