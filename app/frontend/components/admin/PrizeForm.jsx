import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
  Divider,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  EmojiEvents as WinnerIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import EligibilityRulesEditor from './EligibilityRulesEditor';
import DesignateWinnerSelector from './DesignateWinnerSelector';

export default function PrizeForm({ eventId, prize, nextPosition, onSave, onCancel, readOnly = false }) {
  const [formData, setFormData] = useState({
    name: '',
    prize_type_id: null,
    value: '',
    quantity: 1,
    taxable: false,
    position: nextPosition,
    scheduled_at: '',
    allow_repeat_win_override: null,
    eligibility_rules: null,
    designated_participant_ids: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prizeTypes, setPrizeTypes] = useState([]);

  // Load prize types on mount
  useEffect(() => {
    const loadPrizeTypes = async () => {
      try {
        const response = await adminApi.getPrizeTypes();
        setPrizeTypes(response.data);
        // Set default prize type if not editing
        if (!prize && response.data.length > 0) {
          const giftType = response.data.find(pt => pt.code === 'gift');
          setFormData(prev => ({
            ...prev,
            prize_type_id: giftType?.id || response.data[0].id
          }));
        }
      } catch (err) {
        console.error('Failed to load prize types:', err);
      }
    };
    loadPrizeTypes();
  }, []);

  useEffect(() => {
    if (prize) {
      setFormData({
        name: prize.name || '',
        prize_type_id: prize.prize_type_id || null,
        value: prize.value || '',
        quantity: prize.quantity || 1,
        taxable: prize.taxable || false,
        position: prize.position || nextPosition,
        scheduled_at: prize.scheduled_at ? new Date(prize.scheduled_at).toISOString().slice(0, 16) : '',
        allow_repeat_win_override: prize.allow_repeat_win_override,
        eligibility_rules: prize.eligibility_rules || null,
        designated_participant_ids: prize.designated_participant_ids || [],
      });
    }
  }, [prize, nextPosition]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = {
      ...formData,
      value: parseFloat(formData.value),
      quantity: parseInt(formData.quantity),
      scheduled_at: formData.scheduled_at || null,
      eligibility_rules: formData.eligibility_rules || {},
    };

    try {
      if (prize?.id) {
        await adminApi.updatePrize(eventId, prize.id, data);
      } else {
        await adminApi.createPrize(eventId, data);
      }
      onSave?.();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存獎項失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          label="獎項名稱"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="例如：iPhone 15 Pro"
          disabled={readOnly}
        />

        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel>類型</InputLabel>
          <Select
            name="prize_type_id"
            value={formData.prize_type_id || ''}
            label="類型"
            onChange={handleChange}
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
            name="value"
            type="number"
            value={formData.value}
            onChange={handleChange}
            required
            disabled={readOnly}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            fullWidth
            size="small"
            label="數量"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={readOnly}
            inputProps={{ min: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="預定抽獎時間"
            name="scheduled_at"
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={handleChange}
            disabled={readOnly}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            size="small"
            label="順序"
            name="position"
            type="number"
            value={formData.position}
            disabled
            inputProps={{ min: 1 }}
            helperText="由拖曳排列決定"
          />
        </Box>

        <Divider />

        {/* Eligibility Rules (Phase 2) */}
        {readOnly ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FilterIcon fontSize="small" color="info" />
              <Typography variant="subtitle2">參與資格條件</Typography>
            </Box>
            {formData.eligibility_rules && (
              (formData.eligibility_rules.min_seniority_years > 0) ||
              (formData.eligibility_rules.departments?.length > 0)
            ) ? (
              <Box sx={{ pl: 2 }}>
                {formData.eligibility_rules.min_seniority_years > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    最低年資：{formData.eligibility_rules.min_seniority_years} 年
                  </Typography>
                )}
                {formData.eligibility_rules.departments?.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    限定部門：{formData.eligibility_rules.departments.join('、')}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                無特殊條件
              </Typography>
            )}
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterIcon fontSize="small" color="info" />
              <Typography variant="subtitle2">參與資格條件</Typography>
            </Box>
            <EligibilityRulesEditor
              eventId={eventId}
              prizeId={prize?.id}
              value={formData.eligibility_rules}
              onChange={(rules) => setFormData(prev => ({ ...prev, eligibility_rules: rules }))}
            />
          </Paper>
        )}

        {/* Designated Winner (Phase 2) */}
        {readOnly ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2">指定中獎人</Typography>
            </Box>
            {prize?.designated_participants?.length > 0 ? (
              <Box sx={{ pl: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {prize.designated_participants.map(p => (
                  <Chip key={p.id} label={p.name} size="small" variant="outlined" color="warning" />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                無指定中獎人
              </Typography>
            )}
          </Paper>
        ) : (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <DesignateWinnerSelector
              eventId={eventId}
              value={formData.designated_participant_ids}
              maxCount={formData.quantity}
              onChange={(ids) => setFormData(prev => ({ ...prev, designated_participant_ids: ids }))}
            />
          </Paper>
        )}

        {/* Winners Section (only shown when prize is drawn) */}
        {prize?.drawn && prize?.winners?.length > 0 && (
          <>
            <Divider />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WinnerIcon fontSize="small" color="success" />
                <Typography variant="subtitle2" color="success.main">
                  中獎名單 ({prize.winners.length} 人)
                </Typography>
              </Box>
              <List dense disablePadding>
                {prize.winners.map((winner, index) => (
                  <ListItem key={winner.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Typography variant="caption" sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        bgcolor: 'success.main', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11
                      }}>
                        {index + 1}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={winner.name}
                      secondary={[winner.employee_id, winner.department].filter(Boolean).join(' · ')}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {winner.distributed && (
                      <Chip label="已發放" size="small" color="success" sx={{ height: 20 }} />
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </>
        )}
      </Stack>

      <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
        {readOnly ? (
          <Button
            variant="outlined"
            size="small"
            onClick={onCancel}
          >
            關閉
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={loading}
            >
              {loading ? '儲存中...' : '儲存'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CancelIcon />}
              onClick={onCancel}
            >
              取消
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
