import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Typography,
  Paper,
  Switch,
} from '@mui/material';
import { FilterList as FilterIcon, Warning as WarningIcon } from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import EligibilityRulesEditor from './EligibilityRulesEditor';
import DesignateWinnerSelector from './DesignateWinnerSelector';

const initialFormData = {
  name: '',
  prize_type_id: null,
  value: '',
  quantity: 1,
  eligibility_rules: null,
  designated_participant_ids: [],
  allow_repeat_win_override: null,
};

export default function BonusPrizeDialog({ open, eventId, event, onClose, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prizeTypes, setPrizeTypes] = useState([]);

  // Calculate winner stats from event
  const participantsCount = event?.participants_count || 0;
  const uniqueWinnersCount = event?.unique_winners_count || 0;
  const remainingCount = participantsCount - uniqueWinnersCount;
  const allWon = remainingCount <= 0 && participantsCount > 0;

  // Load prize types on mount
  useEffect(() => {
    const loadPrizeTypes = async () => {
      try {
        const response = await adminApi.getPrizeTypes();
        setPrizeTypes(response.data);
      } catch (err) {
        console.error('Failed to load prize types:', err);
      }
    };
    loadPrizeTypes();
  }, []);

  const handleOpen = () => {
    // Set default prize type
    const giftType = prizeTypes.find(pt => pt.code === 'gift');
    setFormData({
      ...initialFormData,
      prize_type_id: giftType?.id || prizeTypes[0]?.id || null,
    });
    setError(null);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRepeatWinChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      allow_repeat_win_override: e.target.checked ? true : null,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('請輸入獎項名稱');
      return;
    }
    if (!formData.value || parseFloat(formData.value) <= 0) {
      setError('請輸入有效的獎項價值');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminApi.createBonusPrize(eventId, {
        name: formData.name.trim(),
        prize_type_id: formData.prize_type_id,
        value: parseFloat(formData.value),
        quantity: parseInt(formData.quantity, 10) || 1,
        eligibility_rules: formData.eligibility_rules || {},
        designated_participant_ids: formData.designated_participant_ids || [],
        allow_repeat_win_override: formData.allow_repeat_win_override,
      });
      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.errors?.join(', ') ||
        err.response?.data?.error ||
        '新增加碼獎項失敗'
      );
    } finally {
      setLoading(false);
    }
  };

  const hasDesignatedParticipants = formData.designated_participant_ids?.length > 0;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>新增加碼獎項</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Winner Statistics Alert */}
        {participantsCount > 0 && (
          <Alert
            severity={allWon ? "warning" : "info"}
            icon={allWon ? <WarningIcon /> : undefined}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              參與者 <strong>{participantsCount}</strong> 人，
              已中獎 <strong>{uniqueWinnersCount}</strong> 人，
              未中獎 <strong>{remainingCount}</strong> 人
            </Typography>
            {allWon && !hasDesignatedParticipants && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                所有人都已中獎！請開啟「允許重複中獎」或指定中獎人。
              </Typography>
            )}
          </Alert>
        )}

        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="獎項名稱"
            value={formData.name}
            onChange={handleChange('name')}
            disabled={loading}
            required
          />

          <FormControl fullWidth size="small">
            <InputLabel>類型</InputLabel>
            <Select
              value={formData.prize_type_id || ''}
              label="類型"
              onChange={handleChange('prize_type_id')}
              disabled={loading}
            >
              {prizeTypes.map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="價值"
              type="number"
              value={formData.value}
              onChange={handleChange('value')}
              disabled={loading}
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">NT$</InputAdornment>,
              }}
              inputProps={{ min: 0 }}
            />

            <TextField
              fullWidth
              size="small"
              label="數量"
              type="number"
              value={formData.quantity}
              onChange={handleChange('quantity')}
              disabled={loading}
              inputProps={{ min: 1 }}
            />
          </Box>

          {/* Allow Repeat Win Override */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.allow_repeat_win_override === true}
                  onChange={handleRepeatWinChange}
                  color="warning"
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">允許重複中獎</Typography>
                  <Typography variant="caption" color="text.secondary">
                    開啟後，已中過獎的參與者也可以再次中獎
                  </Typography>
                </Box>
              }
            />
          </Paper>

          <Divider />

          {/* Eligibility Rules */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterIcon fontSize="small" color="info" />
              <Typography variant="subtitle2">參與資格條件</Typography>
            </Box>
            <EligibilityRulesEditor
              eventId={eventId}
              value={formData.eligibility_rules}
              onChange={(rules) => setFormData(prev => ({ ...prev, eligibility_rules: rules }))}
            />
          </Paper>

          {/* Designated Winner */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <DesignateWinnerSelector
              eventId={eventId}
              value={formData.designated_participant_ids}
              maxCount={parseInt(formData.quantity, 10) || 1}
              onChange={(ids) => setFormData(prev => ({ ...prev, designated_participant_ids: ids }))}
            />
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={loading}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? '新增中...' : '新增加碼獎項'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
