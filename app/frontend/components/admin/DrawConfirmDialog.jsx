import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Casino as DrawIcon,
} from '@mui/icons-material';

export default function DrawConfirmDialog({ prize, onConfirm, onCancel }) {
  const [count, setCount] = useState(prize.quantity);

  const handleCountChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCount(Math.min(Math.max(1, value), prize.quantity));
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DrawIcon color="error" />
          確認抽獎
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 3 }}>
          即將為 <strong>{prize.name}</strong> 進行抽獎。
        </Typography>

        <TextField
          fullWidth
          label="得獎人數"
          type="number"
          value={count}
          onChange={handleCountChange}
          inputProps={{ min: 1, max: prize.quantity }}
          helperText={`最多：${prize.quantity} 位得獎者`}
          sx={{ mb: 3 }}
        />

        <Alert severity="warning" icon={<WarningIcon />}>
          此操作無法復原。抽獎結果將即時廣播給所有觀看者。
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined">
          取消
        </Button>
        <Button
          onClick={() => onConfirm(count)}
          variant="contained"
          color="error"
          startIcon={<DrawIcon />}
        >
          確認抽獎
        </Button>
      </DialogActions>
    </Dialog>
  );
}
