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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function EmployeeRolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/matchlawyer/employeeroles/list');
      if (response.ok) {
        const result = await response.json();
        setRoles(result.data);
      } else {
        toast.error('加载角色列表失败');
      }
    } catch (error) {
      toast.error('加载角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // 打开创建对话框
  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: ''
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description
    });
    setDialogOpen(true);
  };

  // 保存角色
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('请填写完整的角色信息');
      return;
    }

    setSaving(true);
    try {
      const url = editingRole 
        ? '/api/matchlawyer/employeeroles/update'
        : '/api/matchlawyer/employeeroles/create';
      
      const method = editingRole ? 'PUT' : 'POST';
      const body = editingRole 
        ? { ...formData, id: editingRole.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || '操作成功');
        setDialogOpen(false);
        loadRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  // 删除角色
  const handleDelete = async (role) => {
    if (!confirm(`确定要删除角色"${role.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/employeeroles/delete?id=${role.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('角色删除成功');
        loadRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
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
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">
            角色设置
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            新增角色
          </Button>
        </Box>

        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>角色名称</TableCell>
                  <TableCell>权限描述</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.id}</TableCell>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEdit(role)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(role)}
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

        {/* 创建/编辑对话框 */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingRole ? '编辑角色' : '新增角色'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="角色名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：管理员、运维人员、普通用户"
                margin="normal"
              />
              <TextField
                fullWidth
                label="权限描述"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="如：最高权限、运维权限、只读权限"
                multiline
                rows={3}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={saving}
            >
              {saving ? <CircularProgress size={20} /> : '保存'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MatchLawyerLayout>
  );
} 