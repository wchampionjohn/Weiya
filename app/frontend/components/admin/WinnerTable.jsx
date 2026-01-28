import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Checkbox,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Notifications as NotifyIcon,
  LocalShipping as DistributeIcon,
  Send as SendIcon,
} from '@mui/icons-material';

export default function WinnerTable({ winners, onAction, selectable = false, selectedIds = [], onSelectionChange }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuWinner, setMenuWinner] = useState(null);

  if (!winners || winners.length === 0) {
    return null;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange?.(winners.map(w => w.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (winnerId) => {
    if (selectedIds.includes(winnerId)) {
      onSelectionChange?.(selectedIds.filter(id => id !== winnerId));
    } else {
      onSelectionChange?.([...selectedIds, winnerId]);
    }
  };

  const handleOpenMenu = (event, winner) => {
    setMenuAnchor(event.currentTarget);
    setMenuWinner(winner);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuWinner(null);
  };

  const handleMenuAction = (action) => {
    if (menuWinner) {
      onAction?.(menuWinner, action);
    }
    handleCloseMenu();
  };

  const allSelected = winners.length > 0 && selectedIds.length === winners.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < winners.length;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
            )}
            <TableCell>獎項</TableCell>
            <TableCell>得獎者</TableCell>
            <TableCell>聯絡資訊</TableCell>
            <TableCell>抽出時間</TableCell>
            <TableCell align="center">通知</TableCell>
            <TableCell align="center">發放</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {winners.map((winner) => (
            <TableRow
              key={winner.id}
              hover
              selected={selectable && selectedIds.includes(winner.id)}
            >
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.includes(winner.id)}
                    onChange={() => handleSelectOne(winner.id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <Typography variant="subtitle2">{winner.prize?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(winner.prize?.value || 0)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{winner.participant?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {winner.participant?.employee_id}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" display="block">
                  {winner.participant?.phone || '-'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {winner.participant?.email || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {new Date(winner.drawn_at).toISOString().slice(0, 16).replace('T', ' ')}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {winner.notification_requested ? (
                  <Tooltip title="已發送通知" arrow>
                    <span style={{ cursor: 'default' }}>✅</span>
                  </Tooltip>
                ) : null}
              </TableCell>
              <TableCell align="center">
                {winner.distributed ? (
                  <Tooltip title={formatDateTime(winner.distributed_at) || '已發放'} arrow>
                    <span style={{ cursor: 'default' }}>✅</span>
                  </Tooltip>
                ) : null}
              </TableCell>
              <TableCell align="center">
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenMenu(e, winner)}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleMenuAction('notify_only')}>
          <ListItemIcon>
            <NotifyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{menuWinner?.notification_requested ? '再次通知' : '通知'}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('distribute_only')}
          disabled={menuWinner?.distributed}
        >
          <ListItemIcon>
            <DistributeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>標註發放</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuAction('distribute_and_notify')}
          disabled={menuWinner?.distributed}
        >
          <ListItemIcon>
            <SendIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="發放並通知" />
        </MenuItem>
      </Menu>
    </TableContainer>
  );
}
