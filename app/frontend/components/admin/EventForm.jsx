import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  Alert,
  CircularProgress,
  Divider,
  FormHelperText,
  IconButton,
  Tooltip,
  InputAdornment,
  Switch,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  Link as LinkIcon,
  Visibility as DisplayIcon,
  VisibilityOff as PrivacyIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

const FIELD_OPTIONS = [
  { value: 'name', label: '姓名', description: '參與者姓名', required: true },
  { value: 'employee_id', label: '員工編號', description: '公司員工編號' },
  { value: 'phone', label: '電話', description: '電話號碼' },
  { value: 'email', label: 'Email', description: '電子郵件' },
  { value: 'department', label: '部門', description: '所屬部門' },
];

export default function EventForm({ event, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    event_date: '',
    password: '',
    allow_repeat_win: false,
    required_fields: ['name'],
    display_fields: ['name'],
    privacy_enabled: false,
    privacy_settings: {
      name: true,
      employee_id: false,
      phone: true,
      email: true,
      department: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const getPublicUrl = () => {
    if (!event?.id) return '';
    return `${window.location.origin}/events/${event.id}`;
  };

  const handleCopyUrl = async () => {
    const url = getPublicUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  const handleOpenUrl = () => {
    const url = getPublicUrl();
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        password: event.password || '',
        allow_repeat_win: event.allow_repeat_win || false,
        required_fields: event.required_fields || ['name'],
        display_fields: event.display_fields || ['name'],
        privacy_enabled: event.privacy_enabled || false,
        privacy_settings: event.privacy_settings || {
          name: true,
          employee_id: false,
          phone: true,
          email: true,
          department: false,
        },
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFieldToggle = (field) => {
    setFormData(prev => {
      const fields = prev.required_fields.includes(field)
        ? prev.required_fields.filter(f => f !== field)
        : [...prev.required_fields, field];
      return { ...prev, required_fields: fields };
    });
  };

  const handleDisplayFieldToggle = (field) => {
    // Name is always required
    if (field === 'name') return;

    setFormData(prev => {
      const fields = prev.display_fields.includes(field)
        ? prev.display_fields.filter(f => f !== field)
        : [...prev.display_fields, field];
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

    try {
      if (event?.id) {
        await adminApi.updateEvent(event.id, formData);
      } else {
        await adminApi.createEvent(formData);
      }
      onSave?.();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存活動失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 基本資訊 */}
        <TextField
          fullWidth
          label="活動名稱"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="例如：2026 尾牙抽獎"
        />

        <TextField
          fullWidth
          label="活動日期"
          name="event_date"
          type="datetime-local"
          value={formData.event_date}
          onChange={handleChange}
          required
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          label="密碼（選填）"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="留空則不設密碼"
          helperText="設定密碼後，參與者需輸入密碼才能查看活動"
        />

        <Box>
          <FormControlLabel
            control={
              <Switch
                name="allow_repeat_win"
                checked={formData.allow_repeat_win}
                onChange={handleChange}
              />
            }
            label="允許重複中獎"
          />
          <FormHelperText>
            啟用後，同一位參與者可以中多個獎項
          </FormHelperText>
        </Box>

        <Divider />

        {/* 參與者必填欄位 */}
        <Box>
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            參與者必填欄位
          </FormLabel>
          <FormHelperText sx={{ mb: 1 }}>
            選擇匯入參與者時的必填欄位
          </FormHelperText>
          <FormGroup row>
            {FIELD_OPTIONS.map(option => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={formData.required_fields.includes(option.value)}
                    onChange={() => handleFieldToggle(option.value)}
                  />
                }
                label={option.label}
                sx={{ minWidth: 120 }}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider />

        {/* 中獎者顯示欄位 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <DisplayIcon fontSize="small" color="primary" />
            <FormLabel component="legend" sx={{ fontWeight: 600 }}>
              中獎者顯示欄位
            </FormLabel>
          </Box>
          <FormHelperText sx={{ mb: 1 }}>
            選擇在中獎名單中要顯示的欄位（姓名為必填）
          </FormHelperText>
          <FormGroup row>
            {FIELD_OPTIONS.map(option => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={formData.display_fields.includes(option.value)}
                    onChange={() => handleDisplayFieldToggle(option.value)}
                    disabled={option.required}
                  />
                }
                label={option.label + (option.required ? '（必填）' : '')}
                sx={{ minWidth: 120 }}
              />
            ))}
          </FormGroup>
        </Box>

        <Divider />

        {/* 隱私遮罩設定 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PrivacyIcon fontSize="small" color="warning" />
              <FormLabel component="legend" sx={{ fontWeight: 600 }}>
                隱私遮罩設定
              </FormLabel>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.privacy_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, privacy_enabled: e.target.checked }))}
                  color="warning"
                />
              }
              label={formData.privacy_enabled ? '已啟用' : '未啟用'}
            />
          </Box>
          {formData.privacy_enabled && (
            <>
              <FormHelperText sx={{ mb: 1 }}>
                勾選的欄位將套用遮罩（例：王＊明、138****5678）
              </FormHelperText>
              <FormGroup row>
                {FIELD_OPTIONS.filter(opt => formData.display_fields.includes(opt.value)).map(option => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={formData.privacy_settings[option.value] || false}
                        onChange={() => handlePrivacyToggle(option.value)}
                      />
                    }
                    label={option.label}
                    sx={{ minWidth: 120 }}
                  />
                ))}
              </FormGroup>
            </>
          )}
        </Box>

        {/* 活動公開網址 */}
        {event?.id && (
          <>
            <Divider />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LinkIcon color="primary" fontSize="small" />
                <FormLabel component="legend" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  活動公開網址
                </FormLabel>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={getPublicUrl()}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={copied ? '已複製！' : '複製網址'}>
                        <IconButton size="small" onClick={handleCopyUrl}>
                          <CopyIcon fontSize="small" color={copied ? 'success' : 'inherit'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="在新分頁開啟">
                        <IconButton size="small" onClick={handleOpenUrl}>
                          <OpenIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              <FormHelperText>
                分享此網址給參與者，讓他們觀看抽獎直播或查詢中獎結果
              </FormHelperText>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={loading}
        >
          {loading ? '儲存中...' : '儲存活動'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<CancelIcon />}
          onClick={onCancel}
        >
          取消
        </Button>
      </Box>
    </Box>
  );
}
