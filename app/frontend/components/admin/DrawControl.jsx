import React, { useState, useMemo, useEffect } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Casino as DrawIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Lock as LockIcon,
  PlayArrow as SimulateIcon,
  CardGiftcard as BonusIcon,
  Flag as CompleteIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';
import DrawConfirmDialog from './DrawConfirmDialog';
import DrawResultDisplay from './DrawResultDisplay';
import BonusPrizeDialog from './BonusPrizeDialog';

export default function DrawControl({ event, prizes, onUpdate }) {
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [completingEvent, setCompletingEvent] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);

  const isDraft = event.status === 'draft';
  const isActive = event.status === 'active';
  const allPrizesDrawn = event.all_prizes_drawn;

  // Reset participants when winners count changes (after draw)
  useEffect(() => {
    setParticipants([]);
  }, [event.unique_winners_count]);

  // Load participants when list is expanded
  useEffect(() => {
    if (showParticipantsList && participants.length === 0) {
      const loadParticipants = async () => {
        setLoadingParticipants(true);
        try {
          const response = await adminApi.getEventParticipants(event.id);
          setParticipants(response.data);
        } catch (err) {
          console.error('Failed to load participants:', err);
        } finally {
          setLoadingParticipants(false);
        }
      };
      loadParticipants();
    }
  }, [showParticipantsList, event.id, participants.length]);

  const notWonParticipants = useMemo(() => {
    return participants.filter(p => !p.has_won);
  }, [participants]);

  const handleBonusPrizeSaved = () => {
    setShowBonusDialog(false);
    onUpdate?.();
  };

  const handleCompleteEvent = async () => {
    setShowCompleteConfirm(false);
    setCompletingEvent(true);
    try {
      await adminApi.completeEvent(event.id);
      onUpdate?.();
    } catch (err) {
      alert(err.response?.data?.error || '結束活動失敗');
    } finally {
      setCompletingEvent(false);
    }
  };

  // Sort prizes by position for sequential drawing
  const sortedPrizes = useMemo(() => {
    if (!prizes) return [];
    return [...prizes].sort((a, b) => a.position - b.position);
  }, [prizes]);

  // Determine the next prize to draw (first undrawn prize by position)
  const nextPrizeToDraw = useMemo(() => {
    return sortedPrizes.find(p => !p.drawn);
  }, [sortedPrizes]);

  const handleDrawClick = (prize, simulate = false) => {
    setSelectedPrize(prize);
    setIsSimulation(simulate);
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
      let response;
      if (isSimulation) {
        response = await adminApi.simulateDraw(selectedPrize.id, count);
        setDrawResult({ ...response.data, simulated: true });
      } else {
        response = await adminApi.executeDraw(selectedPrize.id, count);
        setDrawResult(response.data);
        onUpdate?.();
      }
    } catch (err) {
      alert(err.response?.data?.error || (isSimulation ? '模擬抽獎失敗' : '抽獎失敗'));
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            抽獎控制
          </Typography>
        </Box>

        {/* Statistics Summary */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {/* Participants Stats */}
          <Accordion
            expanded={showParticipantsList}
            onChange={(e, expanded) => setShowParticipantsList(expanded)}
            sx={{
              flex: 1,
              minWidth: 200,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200',
              '&:before': { display: 'none' },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  👥 參與者
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
                      {event.participants_count || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>人</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="body2" color="success.main">
                      已中獎 {event.unique_winners_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      未中獎 {(event.participants_count || 0) - (event.unique_winners_count || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'grey.200', maxHeight: 200, overflow: 'auto' }}>
              {loadingParticipants ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    未中獎名單（{notWonParticipants.length} 人）：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {notWonParticipants.map((p) => (
                      <Chip
                        key={p.id}
                        label={`${p.name}${p.department ? ` (${p.department})` : ''}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {notWonParticipants.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        所有人都已中獎
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Prizes Stats */}
          <Accordion
            sx={{
              flex: 1,
              minWidth: 200,
              bgcolor: 'grey.50',
              border: 1,
              borderColor: 'grey.200',
              '&:before': { display: 'none' },
            }}
            disableGutters
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  🎁 獎項
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                  <Box>
                    <Typography variant="h5" component="span" sx={{ fontWeight: 600 }}>
                      {sortedPrizes.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>項</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box>
                    <Typography variant="body2" color="success.main">
                      已開出 {drawnPrizes.length}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      未開出 {undrawnPrizes.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'grey.200', maxHeight: 250, overflow: 'auto' }}>
              {/* Drawn Prizes */}
              {drawnPrizes.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
                    已開出（{drawnPrizes.length} 項）：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {drawnPrizes.map((p) => (
                      <Chip
                        key={p.id}
                        label={`${p.name} (${formatCurrency(p.value)})`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Undrawn Prizes */}
              {undrawnPrizes.length > 0 && (
                <Box sx={{ pt: drawnPrizes.length > 0 ? 1.5 : 0, borderTop: drawnPrizes.length > 0 ? 1 : 0, borderColor: 'divider' }}>
                  <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
                    未開出（{undrawnPrizes.length} 項）：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {undrawnPrizes.map((p) => (
                      <Chip
                        key={p.id}
                        label={`${p.name} (${formatCurrency(p.value)})`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>

        {isDraft && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>預覽模式</strong> — 可模擬抽獎測試流程，結果不會儲存。前台可同步預覽。
          </Alert>
        )}

        {event.status === 'completed' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            活動已完成
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
            <Box
              sx={{
                bgcolor: 'success.50',
                border: 3,
                borderColor: 'success.main',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
              }}
            >
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.dark', mb: 2 }}>
                🎉 所有獎項已抽完！
              </Typography>

              {isActive && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    接下來您可以：
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<BonusIcon />}
                      onClick={() => setShowBonusDialog(true)}
                      size="large"
                    >
                      新增加碼獎項
                    </Button>

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={completingEvent ? <CircularProgress size={20} color="inherit" /> : <CompleteIcon />}
                      onClick={() => setShowCompleteConfirm(true)}
                      disabled={completingEvent}
                      size="large"
                    >
                      {completingEvent ? '處理中...' : '結束活動'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                目前：第 {nextPrizeToDraw?.position} 順位 — <strong>{nextPrizeToDraw?.name}</strong>
              </Alert>
              <Box>
                {undrawnPrizes.map((prize, index) => {
                  const isNextToDraw = canDrawPrize(prize);
                  const hasRules = prize.eligibility_rules && (
                    (prize.eligibility_rules.min_seniority_years && prize.eligibility_rules.min_seniority_years > 0) ||
                    (prize.eligibility_rules.departments && prize.eligibility_rules.departments.length > 0)
                  );
                  const hasDesignated = prize.designated_participants?.length > 0;

                  return (
                    <Accordion
                      key={prize.id}
                      sx={{
                        bgcolor: isNextToDraw ? 'warning.50' : 'background.paper',
                        border: 2,
                        borderColor: isNextToDraw ? 'warning.main' : 'grey.200',
                        mb: 1,
                        opacity: isNextToDraw ? 1 : 0.7,
                        '&:before': { display: 'none' },
                      }}
                      disableGutters
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ py: 1 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                          {/* Position Badge */}
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

                          {/* Prize Info */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {prize.name}
                              </Typography>
                              {isNextToDraw && (
                                <Chip size="small" label="下一個" color="warning" sx={{ height: 20 }} />
                              )}
                              {prize.is_bonus && (
                                <Chip size="small" label="加碼" color="warning" variant="outlined" sx={{ height: 20 }} />
                              )}
                              {hasRules && (
                                <Chip size="small" label="有條件" color="info" variant="outlined" sx={{ height: 20 }} />
                              )}
                              {hasDesignated && (
                                <Chip size="small" label="指定" color="secondary" variant="outlined" sx={{ height: 20 }} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(prize.value)} × {prize.quantity} 位得獎者
                            </Typography>
                          </Box>

                          {/* Action Button */}
                          <Box sx={{ ml: 2 }} onClick={(e) => e.stopPropagation()}>
                            {isDraft ? (
                              <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={loading && selectedPrize?.id === prize.id ? <CircularProgress size={16} color="inherit" /> : <SimulateIcon />}
                                onClick={() => handleDrawClick(prize, true)}
                                disabled={loading}
                                size="small"
                              >
                                {loading && selectedPrize?.id === prize.id ? '模擬中...' : '模擬抽獎'}
                              </Button>
                            ) : isNextToDraw ? (
                              <Button
                                variant="contained"
                                color="error"
                                startIcon={loading && selectedPrize?.id === prize.id ? <CircularProgress size={16} color="inherit" /> : <DrawIcon />}
                                onClick={() => handleDrawClick(prize, false)}
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
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: isNextToDraw ? 'warning.main' : 'grey.200' }}>
                        {/* Prize Type */}
                        {prize.prize_type && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            類型：{prize.prize_type.name}
                          </Typography>
                        )}

                        {/* Eligibility Rules */}
                        {hasRules && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              資格條件
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {prize.eligibility_rules.min_seniority_years && (
                                <Chip size="small" label={`年資 ≥ ${prize.eligibility_rules.min_seniority_years} 年`} color="info" />
                              )}
                              {prize.eligibility_rules.departments?.length > 0 && (
                                <Chip size="small" label={`部門：${prize.eligibility_rules.departments.join('、')}`} color="info" />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Designated Participants */}
                        {hasDesignated && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              指定中獎人（{prize.designated_participants.length} 人）
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {prize.designated_participants.map((p) => (
                                <Chip
                                  key={p.id}
                                  label={`${p.name}${p.department ? ` (${p.department})` : ''}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* No special settings */}
                        {!hasRules && !hasDesignated && (
                          <Typography variant="body2" color="text.secondary">
                            無特殊資格條件，所有未中獎參與者皆可抽獎
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
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
            <Box>
              {drawnPrizes.map((prize, index) => (
                <Accordion
                  key={prize.id}
                  sx={{
                    bgcolor: 'success.50',
                    border: 2,
                    borderColor: 'success.light',
                    mb: 1,
                    '&:before': { display: 'none' },
                  }}
                  disableGutters
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                      {/* Position Badge */}
                      <Box sx={{ mr: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
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

                      {/* Prize Info */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {prize.name}
                          </Typography>
                          <Chip size="small" label="已完成" color="success" sx={{ height: 20 }} />
                          {prize.is_bonus && (
                            <Chip size="small" label="加碼" color="warning" sx={{ height: 20 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(prize.value)} × {prize.quantity} 位
                          {prize.winners?.length > 0 && (
                            <span style={{ marginLeft: 8 }}>
                              │ 中獎：{prize.winners.map(w => w.name).join('、')}
                            </span>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'success.light' }}>
                    {/* Draw Time */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      抽出時間：{new Date(prize.drawn_at).toLocaleString('zh-TW')}
                    </Typography>

                    {/* Eligibility Rules */}
                    {prize.eligibility_rules && (
                      (prize.eligibility_rules.min_seniority_years > 0) ||
                      (prize.eligibility_rules.departments?.length > 0)
                    ) && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          資格條件
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {prize.eligibility_rules.min_seniority_years > 0 && (
                            <Chip size="small" label={`年資 ≥ ${prize.eligibility_rules.min_seniority_years} 年`} />
                          )}
                          {prize.eligibility_rules.departments?.length > 0 && (
                            <Chip size="small" label={`部門：${prize.eligibility_rules.departments.join('、')}`} />
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Designated Participants */}
                    {prize.designated_participants?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          指定中獎
                        </Typography>
                        <Typography variant="body2">
                          {prize.designated_participants.map(p => p.name).join('、')}
                        </Typography>
                      </Box>
                    )}

                    {/* Winners with details */}
                    {prize.winners?.length > 0 && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            中獎名單（{prize.winners.length} 人）—
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: 'primary.main' }} />
                            <Typography variant="caption" color="text.secondary">待發放</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: 1, border: 1, borderColor: 'grey.400', bgcolor: 'background.paper' }} />
                            <Typography variant="caption" color="text.secondary">已發放</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {prize.winners.map((winner) => (
                            <Tooltip
                              key={winner.id}
                              title={winner.distributed
                                ? `已發放：${winner.distributed_at ? new Date(winner.distributed_at).toLocaleString('zh-TW') : ''}`
                                : '待發放'}
                              arrow
                            >
                              <Chip
                                label={`${winner.name}${winner.department ? ` (${winner.department})` : ''}`}
                                size="small"
                                color={winner.distributed ? 'default' : 'primary'}
                                variant={winner.distributed ? 'outlined' : 'filled'}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>

      {showConfirm && (
        <DrawConfirmDialog
          prize={selectedPrize}
          simulate={isSimulation}
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

      <BonusPrizeDialog
        open={showBonusDialog}
        eventId={event.id}
        event={event}
        onClose={() => setShowBonusDialog(false)}
        onSuccess={handleBonusPrizeSaved}
      />

      {/* Complete Event Confirmation Dialog */}
      <Dialog
        open={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CompleteIcon color="error" />
          確定要結束活動嗎？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            結束後將無法再進行以下操作：
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 2, color: 'text.secondary' }}>
            <li>抽獎</li>
            <li>新增加碼獎項</li>
            <li>修改獎項設定</li>
            <li>修改活動設定</li>
          </Box>
          <Alert severity="warning" sx={{ mt: 2 }}>
            此操作無法復原，請確認所有獎項已抽完且資料正確。
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setShowCompleteConfirm(false)}
            color="inherit"
          >
            取消
          </Button>
          <Button
            onClick={handleCompleteEvent}
            variant="contained"
            color="error"
            startIcon={<CompleteIcon />}
          >
            確定結束活動
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
