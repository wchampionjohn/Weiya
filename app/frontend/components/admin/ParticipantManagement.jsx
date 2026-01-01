import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formData, setFormData] = useState({ name: '', employee_id: '', phone: '', email: '' });
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, participant: null });

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async (query = '') => {
    try {
      setLoading(true);
      const response = await adminApi.getAllParticipants({ q: query });
      setParticipants(response.data);
      setError(null);
    } catch (err) {
      setError('載入參與者失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    loadParticipants(query);
  };

  const handleOpenForm = (participant = null) => {
    if (participant) {
      setEditingParticipant(participant);
      setFormData({
        name: participant.name,
        employee_id: participant.employee_id || '',
        phone: participant.phone || '',
        email: participant.email || '',
      });
    } else {
      setEditingParticipant(null);
      setFormData({ name: '', employee_id: '', phone: '', email: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingParticipant(null);
    setFormData({ name: '', employee_id: '', phone: '', email: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        await adminApi.updateParticipant(editingParticipant.id, formData);
      } else {
        await adminApi.createParticipant(formData);
      }
      handleCloseForm();
      loadParticipants(searchQuery);
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存失敗');
    }
  };

  const handleDeleteClick = (participant) => {
    setDeleteDialog({ open: true, participant });
  };

  const handleDeleteConfirm = async () => {
    const participantId = deleteDialog.participant?.id;
    setDeleteDialog({ open: false, participant: null });

    try {
      await adminApi.deleteParticipant(participantId);
      loadParticipants(searchQuery);
    } catch (err) {
      setError(err.response?.data?.error || '刪除失敗');
    }
  };

  if (loading && participants.length === 0) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          參與者管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          新增參與者
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="搜尋姓名、員工編號、電話或 Email..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingParticipant ? '編輯參與者' : '新增參與者'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="姓名"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="員工編號"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="電話"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>取消</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              儲存
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Participants Table */}
      {participants.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {searchQuery ? '找不到符合的參與者' : '尚無參與者'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? '請嘗試其他搜尋條件' : '新增您的第一位參與者'}
            </Typography>
            {!searchQuery && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
                新增參與者
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>姓名</TableCell>
                <TableCell>員工編號</TableCell>
                <TableCell>電話</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>參與活動數</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{p.employee_id || '-'}</TableCell>
                  <TableCell>{p.phone || '-'}</TableCell>
                  <TableCell>{p.email || '-'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={`${p.events_count || 0} 個活動`} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenForm(p)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(p)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, participant: null })}
      >
        <DialogTitle>刪除參與者</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除「{deleteDialog.participant?.name}」嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, participant: null })}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
