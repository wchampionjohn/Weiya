import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { adminApi } from '../../lib/api';

export default function CopyEventDialog({ open, event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    copyPrizes: true,
    copyParticipants: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpen = () => {
    setFormData({
      name: `${event?.name || ''} (複製)`,
      copyPrizes: true,
      copyParticipants: false,
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!event) return;

    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.copyEvent(event.id, {
        name: formData.name || undefined,
        copy_prizes: formData.copyPrizes,
        copy_participants: formData.copyParticipants,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.error || '複製活動失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>複製活動</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="新活動名稱"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.copyPrizes}
                onChange={(e) => setFormData({ ...formData, copyPrizes: e.target.checked })}
                disabled={loading}
              />
            }
            label="複製獎項設定"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.copyParticipants}
                onChange={(e) => setFormData({ ...formData, copyParticipants: e.target.checked })}
                disabled={loading}
              />
            }
            label="複製參與者名單"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.name.trim()}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? '複製中...' : '複製'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
