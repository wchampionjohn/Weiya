import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

const NOTIFICATION_TYPES = [
  { value: 'winning', label: '中獎通知' },
  { value: 'distribution', label: '發放通知' },
];

const METHODS = [
  { value: 'sms', label: '簡訊', icon: <SmsIcon fontSize="small" /> },
  { value: 'email', label: 'Email', icon: <EmailIcon fontSize="small" /> },
];

const VARIABLES = [
  { name: 'participant_name', description: '參與者姓名' },
  { name: 'prize_name', description: '獎項名稱' },
  { name: 'event_name', description: '活動名稱' },
  { name: 'department', description: '部門' },
  { name: 'employee_id', description: '工號' },
];

export default function NotificationTemplatesManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, template: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, template: null });
  const [formData, setFormData] = useState({
    name: '',
    notification_type: 'winning',
    method: 'sms',
    content: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getNotificationTemplates();
      setTemplates(response.data);
    } catch (err) {
      setError('載入通知模板失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      notification_type: 'winning',
      method: 'sms',
      content: '',
      is_default: false,
    });
    setEditDialog({ open: true, template: null });
  };

  const handleOpenEdit = (template) => {
    setFormData({
      name: template.name,
      notification_type: template.notification_type,
      method: template.method,
      content: template.content,
      is_default: template.is_default,
    });
    setEditDialog({ open: true, template });
  };

  const handleCloseEdit = () => {
    setEditDialog({ open: false, template: null });
    setFormData({
      name: '',
      notification_type: 'winning',
      method: 'sms',
      content: '',
      is_default: false,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editDialog.template) {
        await adminApi.updateNotificationTemplate(editDialog.template.id, formData);
      } else {
        await adminApi.createNotificationTemplate(formData);
      }
      handleCloseEdit();
      loadTemplates();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (template) => {
    setDeleteDialog({ open: true, template });
  };

  const handleCloseDelete = () => {
    setDeleteDialog({ open: false, template: null });
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminApi.deleteNotificationTemplate(deleteDialog.template.id);
      handleCloseDelete();
      loadTemplates();
    } catch (err) {
      setError(err.response?.data?.error || '刪除失敗');
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (varName) => {
    const textarea = document.getElementById('template-content-input');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const variable = `{${varName}}`;
      const newContent = formData.content.substring(0, start) + variable + formData.content.substring(end);
      setFormData(prev => ({ ...prev, content: newContent }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (filterType !== 'all' && t.notification_type !== filterType) return false;
    if (filterMethod !== 'all' && t.method !== filterMethod) return false;
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">通知模板管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          新增模板
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>通知類型</InputLabel>
          <Select
            value={filterType}
            label="通知類型"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">全部</MenuItem>
            {NOTIFICATION_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>發送方式</InputLabel>
          <Select
            value={filterMethod}
            label="發送方式"
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <MenuItem value="all">全部</MenuItem>
            {METHODS.map(m => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名稱</TableCell>
              <TableCell>通知類型</TableCell>
              <TableCell>發送方式</TableCell>
              <TableCell>內容預覽</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>
                  <Chip
                    label={template.notification_type_label}
                    size="small"
                    color={template.notification_type === 'winning' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={template.method === 'sms' ? <SmsIcon /> : <EmailIcon />}
                    label={template.method_label}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  <Typography variant="body2" noWrap title={template.content}>
                    {template.content}
                  </Typography>
                </TableCell>
                <TableCell>
                  {template.is_default && (
                    <Chip
                      icon={<StarIcon />}
                      label="預設"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEdit(template)}
                    title="編輯"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDelete(template)}
                    title="刪除"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredTemplates.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    沒有符合條件的模板
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          {editDialog.template ? '編輯通知模板' : '新增通知模板'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="名稱"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>通知類型</InputLabel>
                <Select
                  value={formData.notification_type}
                  label="通知類型"
                  onChange={(e) => setFormData(prev => ({ ...prev, notification_type: e.target.value }))}
                >
                  {NOTIFICATION_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>發送方式</InputLabel>
                <Select
                  value={formData.method}
                  label="發送方式"
                  onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
                >
                  {METHODS.map(m => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Variable hints */}
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                變數說明：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {VARIABLES.map(v => (
                  <Typography key={v.name} variant="caption" color="text.secondary">
                    {`{${v.name}}`} = {v.description}
                  </Typography>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                可用變數：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {VARIABLES.map(v => (
                  <Chip
                    key={v.name}
                    label={`{${v.name}}`}
                    size="small"
                    onClick={() => insertVariable(v.name)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              id="template-content-input"
              fullWidth
              label="內容"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              multiline
              rows={formData.method === 'email' ? 8 : 4}
              placeholder={formData.method === 'sms'
                ? '恭喜 {participant_name}，您在 {event_name} 中獲得 {prize_name}！'
                : '親愛的 {participant_name}，\n\n恭喜您在 {event_name} 中獲得 {prize_name}！\n\n祝福您！'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name || !formData.content}
          >
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDelete}>
        <DialogTitle>刪除通知模板</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除「{deleteDialog.template?.name}」嗎？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>取消</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
