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
  IconButton,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Save, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function BenefitTypePage() {
  const [benefitTypes, setBenefitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newRow, setNewRow] = useState({ title: '', isPaid: false });
  const [saving, setSaving] = useState(false);

  // 加载权益类型列表
  const loadBenefitTypes = async () => {
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefittype/list');
      if (response.ok) {
        const result = await response.json();
        setBenefitTypes(result.data);
      } else {
        toast.error('加载权益类型列表失败');
      }
    } catch (error) {
      toast.error('加载权益类型列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenefitTypes();
  }, []);

  // 开始编辑
  const handleEdit = (benefitType) => {
    setEditingId(benefitType.id);
  };

  // 保存编辑
  const handleSave = async (benefitType) => {
    setSaving(true);
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefittype/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(benefitType),
      });

      if (response.ok) {
        toast.success('权益类型更新成功');
        setEditingId(null);
        loadBenefitTypes();
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

  // 删除权益类型
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个权益类型吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/benefit/benefittype/delete?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('权益类型删除成功');
        loadBenefitTypes();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 添加新权益类型
  const handleAdd = async () => {
    if (!newRow.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/matchlawyer/benefit/benefittype/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRow),
      });

      if (response.ok) {
        toast.success('权益类型创建成功');
        setNewRow({ title: '', isPaid: false });
        loadBenefitTypes();
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

  // 更新编辑中的权益类型
  const updateEditingBenefitType = (id, field, value) => {
    setBenefitTypes(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 更新新行数据
  const updateNewRow = (field, value) => {
    setNewRow(prev => ({ ...prev, [field]: value }));
  };

  return (
    <MatchLawyerLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          权益类型管理
        </Typography>

        <Paper elevation={3} sx={{ mt: 3 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>标题</TableCell>
                  <TableCell>是否收费</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* 新行 */}
                    <TableRow>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="请输入标题"
                          value={newRow.title}
                          onChange={(e) => updateNewRow('title', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newRow.isPaid}
                              onChange={(e) => updateNewRow('isPaid', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={handleAdd}
                          disabled={saving || !newRow.title.trim()}
                          color="primary"
                        >
                          {saving ? <CircularProgress size={20} /> : <Add />}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* 现有数据 */}
                    {benefitTypes.map((benefitType) => (
                      <TableRow key={benefitType.id}>
                        <TableCell>
                          {editingId === benefitType.id ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={benefitType.title}
                              onChange={(e) => updateEditingBenefitType(benefitType.id, 'title', e.target.value)}
                            />
                          ) : (
                            benefitType.title
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === benefitType.id ? (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={benefitType.isPaid}
                                  onChange={(e) => updateEditingBenefitType(benefitType.id, 'isPaid', e.target.checked)}
                                />
                              }
                              label=""
                            />
                          ) : (
                            <FormControlLabel
                              control={<Switch checked={benefitType.isPaid} disabled />}
                              label=""
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {editingId === benefitType.id ? (
                            <IconButton
                              onClick={() => handleSave(benefitType)}
                              disabled={saving}
                              color="primary"
                            >
                              {saving ? <CircularProgress size={20} /> : <Save />}
                            </IconButton>
                          ) : (
                            <IconButton
                              onClick={() => handleEdit(benefitType)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          )}
                          <IconButton
                            onClick={() => handleDelete(benefitType.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Alert severity="info" sx={{ mt: 2 }}>
          提示：点击编辑按钮可以修改权益类型信息，点击增加按钮可以创建新的权益类型。
        </Alert>
      </Box>
    </MatchLawyerLayout>
  );
} 