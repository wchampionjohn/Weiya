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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function PrizeTypesManager() {
  const [prizeTypes, setPrizeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialog, setEditDialog] = useState({ open: false, prizeType: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, prizeType: null, usage: null });
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrizeTypes();
  }, []);

  const loadPrizeTypes = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPrizeTypes();
      setPrizeTypes(response.data);
    } catch (err) {
      setError('載入獎品類型失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '', code: '' });
    setEditDialog({ open: true, prizeType: null });
  };

  const handleOpenEdit = (prizeType) => {
    setFormData({ name: prizeType.name, code: prizeType.code });
    setEditDialog({ open: true, prizeType });
  };

  const handleCloseEdit = () => {
    setEditDialog({ open: false, prizeType: null });
    setFormData({ name: '', code: '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editDialog.prizeType) {
        await adminApi.updatePrizeType(editDialog.prizeType.id, formData);
      } else {
        await adminApi.createPrizeType(formData);
      }
      handleCloseEdit();
      loadPrizeTypes();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = async (prizeType) => {
    try {
      const response = await adminApi.checkPrizeTypeUsage(prizeType.id);
      setDeleteDialog({ open: true, prizeType, usage: response.data });
    } catch (err) {
      setError('檢查使用狀態失敗');
    }
  };

  const handleCloseDelete = () => {
    setDeleteDialog({ open: false, prizeType: null, usage: null });
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminApi.deletePrizeType(deleteDialog.prizeType.id);
      handleCloseDelete();
      loadPrizeTypes();
    } catch (err) {
      setError(err.response?.data?.error || '刪除失敗');
    } finally {
      setSaving(false);
    }
  };

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
        <Typography variant="h5">獎品類型管理</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          新增類型
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名稱</TableCell>
              <TableCell>代碼</TableCell>
              <TableCell>使用中獎品數</TableCell>
              <TableCell>狀態</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prizeTypes.map((pt) => (
              <TableRow key={pt.id}>
                <TableCell>{pt.name}</TableCell>
                <TableCell>
                  <Chip label={pt.code} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{pt.prizes_count}</TableCell>
                <TableCell>
                  {pt.is_default ? (
                    <Chip
                      icon={<LockIcon />}
                      label="預設"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ) : (
                    <Chip label="自訂" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEdit(pt)}
                    title="編輯"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  {pt.deletable && (
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDelete(pt)}
                      title="刪除"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editDialog.prizeType ? '編輯獎品類型' : '新增獎品類型'}
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
            <TextField
              fullWidth
              label="代碼"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              required
              disabled={editDialog.prizeType?.is_default}
              helperText="僅限小寫英文字母、數字、底線"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>取消</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name || !formData.code}
          >
            {saving ? '儲存中...' : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDelete}>
        <DialogTitle>刪除獎品類型</DialogTitle>
        <DialogContent>
          {deleteDialog.usage?.in_use ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              此類型目前有 <strong>{deleteDialog.usage.prizes_count}</strong> 個獎品正在使用。
              刪除後，這些獎品的類型將會變為空白。
            </Alert>
          ) : null}
          <Typography>
            確定要刪除「{deleteDialog.prizeType?.name}」嗎？
          </Typography>
          {deleteDialog.usage?.sample_prizes?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                使用此類型的獎品（部分）：
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                {deleteDialog.usage.sample_prizes.map((p) => (
                  <li key={p.id}>
                    <Typography variant="body2">
                      {p.name} ({p.event_name})
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
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
