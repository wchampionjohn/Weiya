import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import CopyEventDialog from './CopyEventDialog';
import { adminApi } from '../../lib/api';

export default function EventList({ onSelect, onNew }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null });
  const [copyDialog, setCopyDialog] = useState({ open: false, event: null });
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuEvent, setMenuEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await adminApi.getEvents();
      setEvents(response.data);
      setError(null);
    } catch (err) {
      setError('載入活動列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const eventId = deleteDialog.event?.id;
    setDeleteDialog({ open: false, event: null });

    try {
      await adminApi.deleteEvent(eventId);
      setEvents(events.filter(ev => ev.id !== eventId));
    } catch (err) {
      setError(err.response?.data?.error || '刪除活動失敗');
    }
  };

  const handleCopyClick = (event) => {
    setCopyDialog({ open: true, event });
    handleCloseMenu();
  };

  const handleCopySuccess = (newEvent) => {
    setEvents([newEvent, ...events]);
  };

  const handleOpenMenu = (e, event) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuEvent(event);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuEvent(null);
  };

  const handleMenuSelect = () => {
    if (menuEvent) {
      onSelect(menuEvent);
    }
    handleCloseMenu();
  };

  const handleMenuDelete = () => {
    if (menuEvent) {
      setDeleteDialog({ open: true, event: menuEvent });
    }
    handleCloseMenu();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'active': return 'success';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '進行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toISOString().slice(0, 16).replace('T', ' ');
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="rectangular" width={140} height={40} />
        </Box>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rectangular" height={72} sx={{ mb: 2, borderRadius: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          活動列表
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNew}
        >
          新增活動
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {events.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <EventIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              尚無活動
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              建立您的第一個抽獎活動吧！
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
              新增活動
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>活動名稱</TableCell>
                <TableCell>日期</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>獎項數</TableCell>
                <TableCell>參與者</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  onClick={() => onSelect(event)}
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {event.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.event_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={getStatusLabel(event.status)}
                      color={getStatusColor(event.status)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.prizes_count || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.participants_count || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, event)}
                    >
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, event: null })}
      >
        <DialogTitle>刪除活動</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除「{deleteDialog.event?.name}」嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, event: null })}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      <CopyEventDialog
        open={copyDialog.open}
        event={copyDialog.event}
        onClose={() => setCopyDialog({ open: false, event: null })}
        onSuccess={handleCopySuccess}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleMenuSelect}>
          <ListItemIcon>
            <OpenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>開啟</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleCopyClick(menuEvent)}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>複製</ListItemText>
        </MenuItem>
        {menuEvent?.status === 'draft' && (
          <MenuItem onClick={handleMenuDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>刪除</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
