import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Description as FileIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function ParticipantImport({ eventId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  const handleImport = async (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await adminApi.importParticipants(eventId, file);
      setResult(response.data);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.errors || '匯入失敗');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleImport(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'text/csv' || file?.name.endsWith('.csv')) {
      handleImport(file);
    } else {
      setError('請上傳 CSV 檔案');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          從 CSV 匯入
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          上傳包含欄位：name, employee_id, phone, email（含標題列）的 CSV 檔案
        </Typography>

        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: 2,
            borderStyle: 'dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: dragActive ? 'primary.50' : 'grey.50',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            style={{ display: 'none' }}
          />

          {loading ? (
            <Box>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography>正在匯入參與者...</Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                拖放 CSV 檔案到此處
              </Typography>
              <Typography variant="body2" color="text.secondary">
                或點擊選擇檔案
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileIcon />}
                sx={{ mt: 2 }}
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              >
                選擇檔案
              </Button>
            </Box>
          )}
        </Box>

        {result && (
          <Alert
            severity="success"
            icon={<CheckIcon />}
            sx={{ mt: 2 }}
            onClose={() => setResult(null)}
          >
            成功匯入 {result.imported_count} 位參與者！
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
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
      </CardContent>
    </Card>
  );
}
