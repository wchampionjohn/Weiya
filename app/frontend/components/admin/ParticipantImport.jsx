import React, { useState, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function ParticipantImport({ eventId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileRef = useRef(null);

  const handleImport = async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await adminApi.importParticipants(eventId, file);
      setResult(response.data);
      setDialogOpen(true);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.errors || '匯入失敗');
      setDialogOpen(true);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleImport(file);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={loading}
        style={{ display: 'none' }}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={loading ? <CircularProgress size={16} /> : <UploadIcon />}
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        {loading ? '匯入中...' : '匯入 CSV'}
      </Button>

      {/* Result/Error Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {result ? '匯入成功' : '匯入結果'}
        </DialogTitle>
        <DialogContent>
          {result && (
            <Alert severity="success">
              成功匯入 {result.imported_count} 位參與者！
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              {Array.isArray(error) ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    匯入錯誤：
                  </Typography>
                  <List dense disablePadding>
                    {error.slice(0, 5).map((e, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <ErrorIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`第 ${e.line} 行：${e.errors.join(', ')}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                    {error.length > 5 && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        ...還有 {error.length - 5} 個錯誤
                      </Typography>
                    )}
                  </List>
                </Box>
              ) : (
                error
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>關閉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
