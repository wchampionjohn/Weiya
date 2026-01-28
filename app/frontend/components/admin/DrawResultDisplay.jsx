import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  EmojiEvents as TrophyIcon,
  PlayArrow as SimulateIcon,
} from '@mui/icons-material';

export default function DrawResultDisplay({ result, onClose }) {
  const { prize, winners, simulated } = result;

  // Get display name from winner (handles both real and simulated results)
  const getDisplayName = (winner) => {
    if (winner.display_data) {
      return winner.display_data.name || '—';
    }
    return winner.participant?.name || '—';
  };

  const getSecondaryText = (winner) => {
    if (winner.display_data) {
      const fields = Object.entries(winner.display_data)
        .filter(([key]) => key !== 'name')
        .map(([_, value]) => value);
      return fields.join(' • ') || null;
    }
    return winner.participant?.employee_id;
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        {simulated ? (
          <SimulateIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
        ) : (
          <CelebrationIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
        )}
        <Typography variant="h5" color={simulated ? 'secondary.main' : 'success.main'} sx={{ fontWeight: 700 }}>
          {simulated ? '模擬抽獎結果' : '抽獎完成！'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {prize?.name}
        </Typography>
        {simulated && (
          <Chip
            label="模擬結果 - 不會儲存"
            color="secondary"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          sx={{
            bgcolor: simulated ? 'secondary.50' : 'success.50',
            borderColor: simulated ? 'secondary.light' : 'success.light',
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            {simulated ? '模擬得獎者' : '得獎者'} ({winners?.length || 0})
          </Typography>
          <List disablePadding>
            {winners?.map((winner, index) => (
              <ListItem
                key={winner.id || winner.event_participant_id || index}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  '&:last-child': { mb: 0 },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: simulated ? 'secondary.main' : 'success.main',
                      width: 32,
                      height: 32,
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getDisplayName(winner)}
                  secondary={getSecondaryText(winner)}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
                <TrophyIcon sx={{ color: 'warning.main' }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color={simulated ? 'secondary' : 'primary'}
          onClick={onClose}
          size="large"
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}
