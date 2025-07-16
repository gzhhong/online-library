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
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

export default function EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
    status: 1
  });
  const [saving, setSaving] = useState(false);

  // 加载员工列表
  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/matchlawyer/employees/list');
      if (response.ok) {
        const result = await response.json();
        setEmployees(result.data);
      } else {
        toast.error('加载员工列表失败');
      }
    } catch (error) {
      toast.error('加载员工列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const response = await fetch('/api/matchlawyer/employeeroles/list');
      if (response.ok) {
        const result = await response.json();
        setRoles(result.data);
      }
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, []);

  // 打开创建对话框
  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      roleId: '',
      status: 1
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      password: '', // 编辑时不显示密码
      roleId: employee.roleId.toString(),
      status: employee.status
    });
    setDialogOpen(true);
  };

  // 保存员工
  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.roleId) {
      toast.error('请填写完整的员工信息');
      return;
    }

    if (!editingEmployee && !formData.password.trim()) {
      toast.error('新员工必须设置密码');
      return;
    }

    setSaving(true);
    try {
      const url = editingEmployee 
        ? '/api/matchlawyer/employees/update'
        : '/api/matchlawyer/employees/create';
      
      const method = editingEmployee ? 'PUT' : 'POST';
      const body = editingEmployee 
        ? { 
            ...formData, 
            id: editingEmployee.id,
            password: formData.password.trim() || undefined // 如果密码为空则不更新
          }
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
        loadEmployees();
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

  // 删除员工
  const handleDelete = async (employee) => {
    if (!confirm(`确定要删除员工"${employee.name}"吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/matchlawyer/employees/delete?id=${employee.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('员工删除成功');
        loadEmployees();
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
    return status === 1 ? (
      <Chip label="启用" color="success" size="small" />
    ) : (
      <Chip label="禁用" color="error" size="small" />
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
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4">
            员工管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            新增员工
          </Button>
        </Box>

        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>姓名</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>手机号</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>
                      <Chip 
                        label={employee.roleName} 
                        color="primary" 
                        size="small"
                        title={employee.roleDescription}
                      />
                    </TableCell>
                    <TableCell>{getStatusDisplay(employee.status)}</TableCell>
                    <TableCell>
                      {new Date(employee.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEdit(employee)}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(employee)}
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
            {editingEmployee ? '编辑员工' : '新增员工'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="邮箱"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label={editingEmployee ? '新密码（留空则不修改）' : '密码'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>角色</InputLabel>
                <Select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  label="角色"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id.toString()}>
                      {role.name} - {role.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status === 1}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      status: e.target.checked ? 1 : 0 
                    })}
                  />
                }
                label="账号状态"
                sx={{ mt: 2 }}
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