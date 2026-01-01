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
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function ParticipantList({ event, onUpdate }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, participant: null });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [allParticipants, setAllParticipants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, [event.id]);

  const loadParticipants = async () => {
    try {
      const response = await adminApi.getEventParticipants(event.id);
      setParticipants(response.data);
      setError(null);
    } catch (err) {
      setError('載入參與者失敗');
    } finally {
      setLoading(false);
    }
  };

  const openSelector = async () => {
    try {
      const response = await adminApi.getAllParticipants();
      // Filter out participants already in this event
      const currentIds = new Set(participants.map(p => p.id));
      const available = response.data.filter(p => !currentIds.has(p.id));
      setAllParticipants(available);
      setSelectedIds([]);
      setSearchQuery('');
      setSelectorOpen(true);
    } catch (err) {
      setError('載入全域參與者失敗');
    }
  };

  const handleAddSelected = async () => {
    if (selectedIds.length === 0) return;

    setAdding(true);
    try {
      for (const participantId of selectedIds) {
        await adminApi.addParticipantToEvent(event.id, participantId);
      }
      setSelectorOpen(false);
      loadParticipants();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || '新增參與者失敗');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteClick = (participant) => {
    setDeleteDialog({ open: true, participant });
  };

  const handleDeleteConfirm = async () => {
    const participantId = deleteDialog.participant?.id;
    setDeleteDialog({ open: false, participant: null });

    try {
      await adminApi.removeParticipantFromEvent(event.id, participantId);
      loadParticipants();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || '移除參與者失敗');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredParticipants = allParticipants.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.employee_id?.toLowerCase().includes(query) ||
      p.phone?.includes(query) ||
      p.email?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            參與者 ({participants.length})
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<PersonAddIcon />}
            size="small"
            onClick={openSelector}
          >
            加入參與者
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {participants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              尚無參與者。從全域參與者列表中加入，或匯入 CSV 檔案。
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>姓名</TableCell>
                  <TableCell>員工編號</TableCell>
                  <TableCell>電話</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>狀態</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>操作</TableCell>
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
                      {p.has_won ? (
                        <Chip size="small" label="已中獎" color="success" />
                      ) : (
                        <Chip size="small" label="未中獎" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(p)}
                        disabled={p.has_won}
                        title={p.has_won ? '已中獎的參與者無法移除' : '移除參與者'}
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
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, participant: null })}
      >
        <DialogTitle>移除參與者</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要從此活動中移除「{deleteDialog.participant?.name}」嗎？
            此操作不會刪除全域參與者資料。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, participant: null })}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            移除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Participant Selector Dialog */}
      <Dialog
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>選擇參與者</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="搜尋姓名、員工編號、電話或 Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {filteredParticipants.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {searchQuery ? '找不到符合的參與者' : '沒有可新增的參與者'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                請先在「參與者管理」中建立全域參與者
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredParticipants.map((p) => (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton onClick={() => toggleSelection(p.id)} dense>
                    <Checkbox
                      edge="start"
                      checked={selectedIds.includes(p.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText
                      primary={p.name}
                      secondary={[p.employee_id, p.phone, p.email].filter(Boolean).join(' · ') || '無額外資訊'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}

          {selectedIds.length > 0 && (
            <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
              已選擇 {selectedIds.length} 位參與者
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectorOpen(false)}>取消</Button>
          <Button
            onClick={handleAddSelected}
            variant="contained"
            disabled={selectedIds.length === 0 || adding}
            startIcon={<AddIcon />}
          >
            {adding ? '新增中...' : '加入活動'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
