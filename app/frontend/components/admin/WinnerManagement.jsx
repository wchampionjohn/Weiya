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
  Button,
  Alert,
} from '@mui/material';
import {
  WorkspacePremium as WinnerIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import WinnerTable from './WinnerTable';
import BatchDistributeDialog from './BatchDistributeDialog';
import SingleWinnerActionDialog from './SingleWinnerActionDialog';

export default function WinnerManagement({ eventId, event }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [prizeFilter, setPrizeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  // Single winner action
  const [showSingleDialog, setShowSingleDialog] = useState(false);
  const [singleActionWinner, setSingleActionWinner] = useState(null);
  const [singleActionType, setSingleActionType] = useState(null);

  // Get drawn prizes from event
  const drawnPrizes = event?.prizes?.filter(p => p.drawn) || [];

  useEffect(() => {
    loadWinners();
  }, [eventId, filter, prizeFilter]);

  const loadWinners = async () => {
    setLoading(true);
    try {
      const options = {};
      if (filter !== 'all') {
        options.distributed = filter === 'distributed';
      }
      if (prizeFilter !== 'all') {
        options.prize_id = prizeFilter;
      }
      const response = await adminApi.getWinners(eventId, options);
      setWinners(response.data);
      setSelectedIds([]);
    } catch (err) {
      console.error('載入得獎者失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (winner, action) => {
    if (action === 'distribute_only') {
      // Directly mark as distributed without dialog
      handleDirectDistribute(winner.id);
    } else {
      // Open single winner dialog for notify actions
      setSingleActionWinner(winner);
      setSingleActionType(action);
      setShowSingleDialog(true);
    }
  };

  const handleDirectDistribute = async (winnerId) => {
    try {
      await adminApi.updateWinner(winnerId, { distributed: true });
      setBatchResult({ distributed_count: 1, skipped_count: 0 });
      loadWinners();
      setTimeout(() => setBatchResult(null), 3000);
    } catch (err) {
      alert('更新得獎者狀態失敗');
    }
  };

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids);
  };

  const handleBatchDistributeSuccess = (result) => {
    setShowBatchDialog(false);
    setBatchResult(result);
    loadWinners();
    setTimeout(() => setBatchResult(null), 5000);
  };

  const handleSingleActionSuccess = (result) => {
    setShowSingleDialog(false);
    setSingleActionWinner(null);
    setSingleActionType(null);
    setBatchResult(result);
    loadWinners();
    setTimeout(() => setBatchResult(null), 5000);
  };

  const handleSingleDialogClose = () => {
    setShowSingleDialog(false);
    setSingleActionWinner(null);
    setSingleActionType(null);
  };

  const selectedWinners = winners.filter(w => selectedIds.includes(w.id));
  const undistributedSelected = selectedWinners.filter(w => !w.distributed).length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            得獎者管理
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {selectedIds.length > 0 && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckIcon />}
                onClick={() => setShowBatchDialog(true)}
                disabled={undistributedSelected === 0}
              >
                批次發放 ({selectedIds.length})
              </Button>
            )}
            {drawnPrizes.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>獎項</InputLabel>
                <Select
                  value={prizeFilter}
                  label="獎項"
                  onChange={(e) => setPrizeFilter(e.target.value)}
                >
                  <MenuItem value="all">全部獎項</MenuItem>
                  {drawnPrizes.map((prize) => (
                    <MenuItem key={prize.id} value={prize.id}>
                      {prize.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>狀態</InputLabel>
              <Select
                value={filter}
                label="狀態"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="pending">待發放</MenuItem>
                <MenuItem value="distributed">已發放</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {batchResult && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setBatchResult(null)}>
            操作完成：
            {batchResult.distributed_count > 0 && `發放 ${batchResult.distributed_count} 筆`}
            {batchResult.skipped_count > 0 && `，略過 ${batchResult.skipped_count} 筆`}
            {batchResult.sms_sent_count > 0 && `，簡訊 ${batchResult.sms_sent_count} 則`}
            {batchResult.email_sent_count > 0 && `，Email ${batchResult.email_sent_count} 封`}
          </Alert>
        )}

        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={200} />
          </Box>
        ) : winners.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <WinnerIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              {filter === 'all' && prizeFilter === 'all'
                ? '尚無得獎者。完成抽獎後將在這裡顯示得獎者。'
                : '沒有符合此篩選條件的得獎者。'}
            </Typography>
          </Box>
        ) : (
          <WinnerTable
            winners={winners}
            onAction={handleAction}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </CardContent>

      <BatchDistributeDialog
        open={showBatchDialog}
        selectedWinners={selectedWinners}
        event={event}
        onClose={() => setShowBatchDialog(false)}
        onSuccess={handleBatchDistributeSuccess}
      />

      <SingleWinnerActionDialog
        open={showSingleDialog}
        winner={singleActionWinner}
        event={event}
        action={singleActionType}
        onClose={handleSingleDialogClose}
        onSuccess={handleSingleActionSuccess}
      />
    </Card>
  );
}
