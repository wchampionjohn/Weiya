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
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

export default function DrawResultDisplay({ result, onClose }) {
  const { prize, winners } = result;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <CelebrationIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
        <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>
          抽獎完成！
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {prize.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          sx={{
            bgcolor: 'success.50',
            borderColor: 'success.light',
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            得獎者 ({winners.length})
          </Typography>
          <List disablePadding>
            {winners.map((winner, index) => (
              <ListItem
                key={winner.id}
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
                      bgcolor: 'success.main',
                      width: 32,
                      height: 32,
                      fontSize: 14,
                    }}
                  >
                    {index + 1}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={winner.participant?.name}
                  secondary={winner.participant?.employee_id}
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
          onClick={onClose}
          size="large"
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}
