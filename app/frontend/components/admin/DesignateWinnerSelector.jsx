import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Paper,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function DesignateWinnerSelector({ eventId, value = [], maxCount = 1, onChange }) {
  const [enabled, setEnabled] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Sync enabled state with value
  useEffect(() => {
    if (value && value.length > 0) {
      setEnabled(true);
      loadSelectedParticipants(value);
    } else {
      setEnabled(false);
      setSelectedParticipants([]);
    }
  }, [value]);

  useEffect(() => {
    if (eventId && enabled) {
      loadParticipants();
    }
  }, [eventId, enabled]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getEventParticipants(eventId);
      setParticipants(response.data);
    } catch (err) {
      console.error('Failed to load participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedParticipants = async (ids) => {
    try {
      const response = await adminApi.getEventParticipants(eventId);
      const selected = response.data.filter(p => ids.includes(p.id));
      setSelectedParticipants(selected);
    } catch (err) {
      console.error('Failed to load participant details:', err);
    }
  };

  const handleToggle = (e) => {
    const checked = e.target.checked;
    setEnabled(checked);
    if (!checked) {
      setSelectedParticipants([]);
      onChange([]);
    }
  };

  const handleSelect = (participant) => {
    if (selectedParticipants.find(p => p.id === participant.id)) {
      return; // Already selected
    }
    if (selectedParticipants.length >= maxCount) {
      return; // Reached max
    }
    const newSelected = [...selectedParticipants, participant];
    setSelectedParticipants(newSelected);
    onChange(newSelected.map(p => p.id));
    setSearchQuery('');
  };

  const handleRemove = (participantId) => {
    const newSelected = selectedParticipants.filter(p => p.id !== participantId);
    setSelectedParticipants(newSelected);
    onChange(newSelected.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedParticipants([]);
    onChange([]);
  };

  const filteredParticipants = participants.filter(p => {
    // Exclude already selected
    if (selectedParticipants.find(s => s.id === p.id)) {
      return false;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(query) ||
      p.employee_id?.toLowerCase().includes(query) ||
      p.department?.toLowerCase().includes(query)
    );
  });

  const canAddMore = selectedParticipants.length < maxCount;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={handleToggle}
            color="warning"
          />
        }
        label={
          <Typography variant="subtitle2">
            指定中獎人
          </Typography>
        }
      />

      {enabled && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            指定中獎人後，抽獎時將直接選出指定人選，不進行隨機抽選。
            {maxCount > 1 && ` 最多可指定 ${maxCount} 人。`}
          </Alert>

          {/* Selected participants */}
          {selectedParticipants.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  已指定 {selectedParticipants.length} / {maxCount} 人
                </Typography>
                <IconButton size="small" onClick={handleClearAll} title="清除全部">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedParticipants.map((p) => (
                  <Chip
                    key={p.id}
                    label={`${p.name}${p.department ? ` (${p.department})` : ''}`}
                    color="warning"
                    onDelete={() => handleRemove(p.id)}
                    sx={{ mb: 0.5 }}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* Search and select (only show if can add more) */}
          {canAddMore && (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder="搜尋參與者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <List dense disablePadding>
                    {filteredParticipants.length === 0 ? (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="body2" color="text.secondary" align="center">
                              {searchQuery ? '找不到符合的參與者' : '尚無可選擇的參與者'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ) : (
                      filteredParticipants.slice(0, 20).map((p) => (
                        <ListItemButton
                          key={p.id}
                          onClick={() => handleSelect(p)}
                          sx={p.has_won ? { bgcolor: 'success.50' } : {}}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{p.name}</span>
                                {p.has_won && (
                                  <Chip label="已中獎" size="small" color="success" sx={{ height: 20 }} />
                                )}
                              </Box>
                            }
                            secondary={[p.employee_id, p.department].filter(Boolean).join(' · ') || '無額外資訊'}
                          />
                        </ListItemButton>
                      ))
                    )}
                    {filteredParticipants.length > 20 && (
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="caption" color="text.secondary" align="center">
                              還有 {filteredParticipants.length - 20} 位...請使用搜尋縮小範圍
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              )}
            </>
          )}

          {!canAddMore && selectedParticipants.length > 0 && (
            <Typography variant="body2" color="text.secondary" align="center">
              已達指定人數上限
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
