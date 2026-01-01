import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  WorkspacePremium as WinnerIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import WinnerTable from './WinnerTable';

export default function WinnerManagement({ eventId }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWinners();
  }, [eventId, filter]);

  const loadWinners = async () => {
    setLoading(true);
    try {
      const options = filter !== 'all' ? { distributed: filter === 'distributed' } : {};
      const response = await adminApi.getWinners(eventId, options);
      setWinners(response.data);
    } catch (err) {
      console.error('載入得獎者失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async (winnerId) => {
    try {
      await adminApi.updateWinner(winnerId, { distributed: true });
      loadWinners();
    } catch (err) {
      alert('更新得獎者狀態失敗');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            得獎者管理
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>篩選</InputLabel>
            <Select
              value={filter}
              label="篩選"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">全部得獎者</MenuItem>
              <MenuItem value="pending">待發放</MenuItem>
              <MenuItem value="distributed">已發放</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={200} />
          </Box>
        ) : winners.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <WinnerIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              {filter === 'all' ? '尚無得獎者。完成抽獎後將在這裡顯示得獎者。' : '沒有符合此篩選條件的得獎者。'}
            </Typography>
          </Box>
        ) : (
          <WinnerTable winners={winners} onDistribute={handleDistribute} />
        )}
      </CardContent>
    </Card>
  );
}
