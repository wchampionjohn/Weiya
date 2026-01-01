import React from 'react';
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
  Chip,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
} from '@mui/icons-material';

export default function WinnerTable({ winners, onDistribute }) {
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

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>獎項</TableCell>
            <TableCell>得獎者</TableCell>
            <TableCell>聯絡資訊</TableCell>
            <TableCell>抽出時間</TableCell>
            <TableCell align="center">狀態</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {winners.map((winner) => (
            <TableRow key={winner.id} hover>
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
                  {new Date(winner.drawn_at).toLocaleString('zh-TW')}
                </Typography>
              </TableCell>
              <TableCell align="center">
                {winner.distributed ? (
                  <Chip
                    size="small"
                    icon={<CheckIcon />}
                    label="已發放"
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip
                    size="small"
                    icon={<PendingIcon />}
                    label="待發放"
                    color="warning"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell align="center">
                {!winner.distributed && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onDistribute(winner.id)}
                  >
                    標記已發放
                  </Button>
                )}
                {winner.distributed && winner.distributed_at && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(winner.distributed_at).toLocaleDateString('zh-TW')}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
