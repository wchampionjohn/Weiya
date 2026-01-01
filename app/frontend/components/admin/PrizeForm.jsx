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
  Grid,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Divider,
  Typography,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as DisplayIcon,
  VisibilityOff as PrivacyIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

const DISPLAY_FIELD_OPTIONS = [
  { value: 'name', label: '姓名' },
  { value: 'employee_id', label: '員工編號' },
  { value: 'phone', label: '電話' },
  { value: 'email', label: 'Email' },
  { value: 'department', label: '部門' },
];

export default function PrizeForm({ eventId, prize, nextPosition, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    prize_type: 'gift',
    value: '',
    quantity: 1,
    taxable: false,
    position: nextPosition,
    display_fields: ['name'],
    privacy_settings: { name: true },
    scheduled_at: '',
    allow_repeat_win_override: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (prize) {
      setFormData({
        name: prize.name || '',
        prize_type: prize.prize_type || 'gift',
        value: prize.value || '',
        quantity: prize.quantity || 1,
        taxable: prize.taxable || false,
        position: prize.position || nextPosition,
        display_fields: prize.display_fields || ['name'],
        privacy_settings: prize.privacy_settings || { name: true },
        scheduled_at: prize.scheduled_at ? new Date(prize.scheduled_at).toISOString().slice(0, 16) : '',
        allow_repeat_win_override: prize.allow_repeat_win_override,
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

  const handleDisplayFieldToggle = (field) => {
    setFormData(prev => {
      const fields = prev.display_fields.includes(field)
        ? prev.display_fields.filter(f => f !== field)
        : [...prev.display_fields, field];
      // Ensure at least one field is selected
      if (fields.length === 0) return prev;
      return { ...prev, display_fields: fields };
    });
  };

  const handlePrivacyToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [field]: !prev.privacy_settings[field],
      },
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

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            size="small"
            label="獎項名稱"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="例如：iPhone 15 Pro"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>類型</InputLabel>
            <Select
              name="prize_type"
              value={formData.prize_type}
              label="類型"
              onChange={handleChange}
            >
              <MenuItem value="gift">禮品</MenuItem>
              <MenuItem value="cash">現金</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="價值"
            name="value"
            type="number"
            value={formData.value}
            onChange={handleChange}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="數量"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="順序"
            name="position"
            type="number"
            value={formData.position}
            onChange={handleChange}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="預定抽獎時間"
            name="scheduled_at"
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* Display Fields Settings */}
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DisplayIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2">顯示欄位</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              選擇在得獎名單中要顯示的欄位
            </Typography>
            <FormGroup row>
              {DISPLAY_FIELD_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.display_fields.includes(option.value)}
                      onChange={() => handleDisplayFieldToggle(option.value)}
                    />
                  }
                  label={<Typography variant="body2">{option.label}</Typography>}
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* Privacy Settings */}
        <Grid item xs={12} sm={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PrivacyIcon fontSize="small" color="warning" />
              <Typography variant="subtitle2">隱私遮罩</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              勾選的欄位將會套用隱私遮罩（例：王＊明、138****5678）
            </Typography>
            <FormGroup row>
              {DISPLAY_FIELD_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.privacy_settings[option.value] || false}
                      onChange={() => handlePrivacyToggle(option.value)}
                      disabled={!formData.display_fields.includes(option.value)}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      color={formData.display_fields.includes(option.value) ? 'text.primary' : 'text.disabled'}
                    >
                      {option.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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
      </Box>
    </Box>
  );
}
