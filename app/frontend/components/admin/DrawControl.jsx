import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Casino as DrawIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import DrawConfirmDialog from './DrawConfirmDialog';
import DrawResultDisplay from './DrawResultDisplay';

export default function DrawControl({ event, prizes, onUpdate }) {
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sort prizes by position for sequential drawing
  const sortedPrizes = useMemo(() => {
    if (!prizes) return [];
    return [...prizes].sort((a, b) => a.position - b.position);
  }, [prizes]);

  // Determine the next prize to draw (first undrawn prize by position)
  const nextPrizeToDraw = useMemo(() => {
    return sortedPrizes.find(p => !p.drawn);
  }, [sortedPrizes]);

  const handleDrawClick = (prize) => {
    setSelectedPrize(prize);
    setShowConfirm(true);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '進行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  // Check if a prize can be drawn (must be next in sequence)
  const canDrawPrize = (prize) => {
    return nextPrizeToDraw && prize.id === nextPrizeToDraw.id;
  };

  const handleConfirmDraw = async (count) => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const response = await adminApi.executeDraw(selectedPrize.id, count);
      setDrawResult(response.data);
      onUpdate?.();
    } catch (err) {
      alert(err.response?.data?.error || '抽獎失敗');
    } finally {
      setLoading(false);
    }
  };

  const undrawnPrizes = sortedPrizes.filter(p => !p.drawn);
  const drawnPrizes = sortedPrizes.filter(p => p.drawn);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          抽獎控制
        </Typography>

        {event.status !== 'active' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            活動必須處於「進行中」狀態才能執行抽獎。目前狀態：<strong>{getStatusLabel(event.status)}</strong>
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ScheduleIcon color="action" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              待抽獎項 ({undrawnPrizes.length})
            </Typography>
          </Box>

          {undrawnPrizes.length === 0 ? (
            <Alert severity="success" icon={<CheckIcon />}>
              所有獎項已抽完！
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                目前：第 {nextPrizeToDraw?.position} 順位 — <strong>{nextPrizeToDraw?.name}</strong>
              </Alert>
              <List disablePadding>
                {undrawnPrizes.map((prize, index) => {
                  const isNextToDraw = canDrawPrize(prize);
                  const isDisabled = loading || event.status !== 'active' || !isNextToDraw;

                  return (
                    <ListItem
                      key={prize.id}
                      sx={{
                        bgcolor: isNextToDraw ? 'warning.50' : 'background.paper',
                        border: 2,
                        borderColor: isNextToDraw ? 'warning.main' : 'grey.200',
                        borderRadius: 1,
                        mb: 1,
                        opacity: isNextToDraw ? 1 : 0.7,
                      }}
                      secondaryAction={
                        isNextToDraw ? (
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={loading && selectedPrize?.id === prize.id ? <CircularProgress size={16} color="inherit" /> : <DrawIcon />}
                            onClick={() => handleDrawClick(prize)}
                            disabled={loading || event.status !== 'active'}
                            size="small"
                          >
                            {loading && selectedPrize?.id === prize.id ? '抽獎中...' : '抽獎'}
                          </Button>
                        ) : (
                          <Tooltip title={`須先完成第 ${nextPrizeToDraw?.position} 順位的抽獎`}>
                            <span>
                              <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<LockIcon />}
                                disabled
                                size="small"
                              >
                                等待中
                              </Button>
                            </span>
                          </Tooltip>
                        )
                      }
                    >
                      <Box sx={{ mr: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: isNextToDraw ? 'warning.main' : 'grey.400',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                          }}
                        >
                          {prize.position || index + 1}
                        </Typography>
                      </Box>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{prize.name}</span>
                            {isNextToDraw && (
                              <Chip size="small" label="下一個" color="warning" sx={{ height: 20 }} />
                            )}
                          </Box>
                        }
                        secondary={`${formatCurrency(prize.value)} × ${prize.quantity} 位得獎者`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckIcon color="success" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              已完成抽獎 ({drawnPrizes.length})
            </Typography>
          </Box>

          {drawnPrizes.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              尚無已完成的抽獎。
            </Typography>
          ) : (
            <List disablePadding>
              {drawnPrizes.map((prize) => (
                <ListItem
                  key={prize.id}
                  sx={{
                    bgcolor: 'success.50',
                    border: 1,
                    borderColor: 'success.light',
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{prize.name}</Typography>
                        <Chip size="small" label="已完成" color="success" sx={{ height: 20 }} />
                      </Box>
                    }
                    secondary={`抽出時間：${new Date(prize.drawn_at).toLocaleString('zh-TW')}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </CardContent>

      {showConfirm && (
        <DrawConfirmDialog
          prize={selectedPrize}
          onConfirm={handleConfirmDraw}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {drawResult && (
        <DrawResultDisplay
          result={drawResult}
          onClose={() => setDrawResult(null)}
        />
      )}
    </Card>
  );
}
