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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [benefitGroups, setBenefitGroups] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [activityMembers, setActivityMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const MAX_FILE_SIZE = 80 * 1024; // 80KB
  const MAX_IMAGES = 1;

  // 加载活动列表
  const loadActivities = async () => {
    try {
      const response = await fetch('/api/matchlawyer/activities/list');
      if (response.ok) {
        const result = await response.json();
        setActivities(result.data);
      } else {
        toast.error('加载活动列表失败');
      }
    } catch (error) {
      toast.error('加载活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载权益分组
  const loadBenefitGroups = async () => {
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefitgroup/titles');
      if (response.ok) {
        const result = await response.json();
        // 将字符串数组转换为对象数组，使用索引作为id
        const groupsWithIds = result.data.map((title, index) => ({
          id: index + 1, // 从1开始，因为0表示"全部"
          title: title
        }));
        setBenefitGroups(groupsWithIds);
      }
    } catch (error) {
      console.error('加载权益分组失败:', error);
    }
  };

  useEffect(() => {
    loadActivities();
    loadBenefitGroups();
  }, []);

  // 处理文件选择
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (selectedImages.length + files.length > MAX_IMAGES) {
      toast.error(`最多只能上传${MAX_IMAGES}张图片`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`图片 ${file.name} 超过80KB限制`);
        continue;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`图片 ${file.name} 格式不支持，只支持 JPG, PNG, GIF`);
        continue;
      }

      setSelectedImages(prev => [...prev, file]);
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 打开添加对话框
  const handleAddActivity = () => {
    setSelectedActivity({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      isPaid: false,
      price: 0,
      targetGroups: [0], // 默认全部
      canUseBenefit: false,
      minParticipants: 1,
      maxParticipants: 100
    });
    setSelectedImages([]);
    setEditMode(false);
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEditActivity = (activity) => {
    setSelectedActivity({
      ...activity,
      startTime: new Date(activity.startTime).toISOString().slice(0, 16),
      endTime: new Date(activity.endTime).toISOString().slice(0, 16)
    });
    setSelectedImages([]);
    setEditMode(true);
    setDialogOpen(true);
  };

  // 保存活动
  const handleSaveActivity = async () => {
    if (!selectedActivity) return;

    setSubmitting(true);
    try {
      // 上传图片
      const imagePaths = [];
      const imageTcpIds = [];
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const ext = image.name.split('.').pop();
          const fileName = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const cloudPath = `activities/${fileName}`;

          const uploadRes = await fetch('/api/matchlawyer/activities/upload', {
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

          imagePaths.push(`/activities/${fileName}`);
          imageTcpIds.push(uploadData.file_id);
        }
      }

      // 合并现有图片和新上传的图片
      const allImages = [
        ...(selectedActivity.images || []),
        ...imagePaths
      ];
      const allImageTcpIds = [
        ...(selectedActivity.imageTcpId || []),
        ...imageTcpIds
      ];

      const activityData = {
        ...selectedActivity,
        images: allImages,
        imageTcpId: allImageTcpIds
      };

      const url = editMode ? '/api/matchlawyer/activities/update' : '/api/matchlawyer/activities/create';
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setDialogOpen(false);
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存活动错误:', error);
      toast.error('保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 查看活动成员
  const handleViewMembers = async (activity) => {
    setSelectedActivity(activity);
    setLoadingMembers(true);
    setMembersDialogOpen(true);

    try {
      const response = await fetch(`/api/matchlawyer/activitymembers/list?activityId=${activity.id}`);
      if (response.ok) {
        const result = await response.json();
        setActivityMembers(result.data);
      } else {
        toast.error('加载活动成员失败');
      }
    } catch (error) {
      toast.error('加载活动成员失败');
    } finally {
      setLoadingMembers(false);
    }
  };

  // 编辑成员缴费状态
  const handleEditMember = (member) => {
    setEditingMember({
      id: member.id,
      isPaid: member.isPaid
    });
  };

  // 保存成员缴费状态
  const handleSaveMember = async () => {
    if (!editingMember) return;

    try {
      const response = await fetch('/api/matchlawyer/activitymembers/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingMember),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        
        // 更新本地数据
        setActivityMembers(prev => prev.map(member => 
          member.id === editingMember.id 
            ? { ...member, isPaid: editingMember.isPaid }
            : member
        ));
        
        setEditingMember(null);
      } else {
        const error = await response.json();
        toast.error(error.error || '保存失败');
      }
    } catch (error) {
      toast.error('保存失败');
    }
  };

  // 删除活动
  const handleDeleteActivity = async (id) => {
    if (!confirm('确定要删除这个活动吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/activities/delete?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('活动删除成功');
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 获取图片完整URL
  function getFullUrl(fileId) {
    const fileIdEncoded = encodeURIComponent(fileId);
    return `${window.location.origin}/api/matchlawyer/files?file_id=${fileIdEncoded}`;
  }

  // 格式化时间
  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('zh-CN');
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            活动管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddActivity}
          >
            添加活动
          </Button>
        </Box>

        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>活动名称</TableCell>
                  <TableCell>举办时间</TableCell>
                  <TableCell>地点</TableCell>
                  <TableCell>收费状态</TableCell>
                  <TableCell>目标群体</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow 
                    key={activity.id}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewMembers(activity)}
                    hover
                  >
                    <TableCell>{activity.title}</TableCell>
                    <TableCell>
                      {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
                    </TableCell>
                    <TableCell>{activity.location}</TableCell>
                    <TableCell>
                      {activity.isPaid ? (
                        <Chip label={`¥${activity.price}`} color="primary" size="small" />
                      ) : (
                        <Chip label="免费" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.targetGroups.includes(0) ? (
                        <Chip label="全部" color="default" size="small" />
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {activity.targetGroups.map((groupId) => {
                            const group = benefitGroups.find(g => g.id === groupId);
                            return (
                              <Chip 
                                key={groupId} 
                                label={group ? group.title : `分组${groupId}`} 
                                color="info" 
                                size="small" 
                              />
                            );
                          })}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        onClick={() => handleEditActivity(activity)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteActivity(activity.id)}
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

        {/* 编辑对话框 */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editMode ? '编辑活动' : '添加活动'}
          </DialogTitle>
          <DialogContent>
            {selectedActivity && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="活动名称"
                      value={selectedActivity.title}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        title: e.target.value
                      })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="活动简介"
                      multiline
                      rows={3}
                      value={selectedActivity.description || ''}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        description: e.target.value
                      })}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="开始时间"
                      type="datetime-local"
                      value={selectedActivity.startTime}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        startTime: e.target.value
                      })}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="结束时间"
                      type="datetime-local"
                      value={selectedActivity.endTime}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        endTime: e.target.value
                      })}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="活动地点"
                      value={selectedActivity.location}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        location: e.target.value
                      })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedActivity.isPaid}
                          onChange={(e) => setSelectedActivity({
                            ...selectedActivity,
                            isPaid: e.target.checked
                          })}
                        />
                      }
                      label="是否收费"
                    />
                  </Grid>

                  {selectedActivity.isPaid && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="价格"
                        type="number"
                        value={selectedActivity.price}
                        onChange={(e) => setSelectedActivity({
                          ...selectedActivity,
                          price: parseFloat(e.target.value) || 0
                        })}
                        InputProps={{
                          startAdornment: <span>¥</span>
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>目标群体</InputLabel>
                      <Select
                        multiple
                        value={selectedActivity.targetGroups}
                        onChange={(e) => setSelectedActivity({
                          ...selectedActivity,
                          targetGroups: e.target.value
                        })}
                        label="目标群体"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => {
                              if (value === 0) {
                                return <Chip key={value} label="全部" size="small" />;
                              }
                              const group = benefitGroups.find(g => g.id === value);
                              return (
                                <Chip key={value} label={group ? group.title : `分组${value}`} size="small" />
                              );
                            })}
                          </Box>
                        )}
                      >
                        <MenuItem value={0}>
                          <em>全部</em>
                        </MenuItem>
                        {benefitGroups.map((group) => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="人数下限"
                      type="number"
                      value={selectedActivity.minParticipants}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        minParticipants: parseInt(e.target.value) || 1
                      })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="人数上限"
                      type="number"
                      value={selectedActivity.maxParticipants}
                      onChange={(e) => setSelectedActivity({
                        ...selectedActivity,
                        maxParticipants: parseInt(e.target.value) || 100
                      })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedActivity.canUseBenefit}
                          onChange={(e) => setSelectedActivity({
                            ...selectedActivity,
                            canUseBenefit: e.target.checked
                          })}
                        />
                      }
                      label="可以使用权益抵扣"
                    />
                  </Grid>

                  {/* 图片上传 */}
                  <Grid item xs={12}>
                    <Box>
                      <input
                        accept="image/*"
                        type="file"
                        id="activity-image-files"
                        multiple
                        onChange={handleFileChange}
                        onClick={(e) => { e.target.value = ''; }}
                        style={{ display: 'none' }}
                        disabled={submitting}
                      />
                      <label htmlFor="activity-image-files">
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
                        支持 JPG, PNG, GIF 格式，每张图片不超过80KB，最多5张
                      </Typography>
                      
                      {/* 显示已选择的图片 */}
                      {selectedImages.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            新选择的图片:
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

                      {/* 显示现有图片 */}
                      {selectedActivity.imageTcpId && selectedActivity.imageTcpId.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            现有图片:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {selectedActivity.imageTcpId.map((fileId, index) => (
                              <Card key={index} sx={{ width: 150 }}>
                                <CardMedia
                                  component="img"
                                  height="100"
                                  image={getFullUrl(fileId)}
                                  alt={`图片 ${index + 1}`}
                                />
                                <CardContent sx={{ p: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    图片 {index + 1}
                                  </Typography>
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleSaveActivity}
              variant="contained"
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={20} /> : '保存'}
            </Button>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
          </DialogActions>
        </Dialog>

        {/* 活动成员对话框 */}
        <Dialog
          open={membersDialogOpen}
          onClose={() => setMembersDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedActivity ? `${selectedActivity.title} - 参与成员` : '活动成员'}
          </DialogTitle>
          <DialogContent>
            {loadingMembers ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                {activityMembers.length === 0 ? (
                  <Alert severity="info">
                    暂无成员参与此活动
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>成员姓名</TableCell>
                          <TableCell>联系电话</TableCell>
                          <TableCell>缴费状态</TableCell>
                          <TableCell>操作</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activityMembers.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>{member.memberName}</TableCell>
                            <TableCell>{member.memberPhone}</TableCell>
                            <TableCell>
                              {editingMember && editingMember.id === member.id ? (
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={editingMember.isPaid}
                                      onChange={(e) => setEditingMember({
                                        ...editingMember,
                                        isPaid: e.target.checked
                                      })}
                                    />
                                  }
                                  label={editingMember.isPaid ? '已缴费' : '未缴费'}
                                />
                              ) : (
                                <Chip 
                                  label={member.isPaid ? '已缴费' : '未缴费'} 
                                  color={member.isPaid ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {editingMember && editingMember.id === member.id ? (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleSaveMember}
                                  >
                                    保存
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={() => setEditingMember(null)}
                                  >
                                    取消
                                  </Button>
                                </Box>
                              ) : (
                                <IconButton
                                  onClick={() => handleEditMember(member)}
                                  color="primary"
                                  size="small"
                                >
                                  <Edit />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMembersDialogOpen(false)}>
              关闭
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MatchLawyerLayout>
  );
} 