import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  FormControlLabel,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  EmojiEvents as PrizeIcon,
  Casino as DrawIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

const DEFAULT_PARTICIPANTS = [
  { name: '', employee_id: '', phone: '', email: '' },
  { name: '', employee_id: '', phone: '', email: '' },
  { name: '', employee_id: '', phone: '', email: '' },
  { name: '', employee_id: '', phone: '', email: '' },
  { name: '', employee_id: '', phone: '', email: '' },
  { name: '', employee_id: '', phone: '', email: '' },
];

const DEFAULT_PRIZES = [
  { name: '', prize_type_id: null, value: '', quantity: 1 },
];

const SAMPLE_PRIZES = [
  { name: '三獎', prize_type_id: null, value: 200, quantity: 3 },
  { name: '二獎', prize_type_id: null, value: 500, quantity: 2 },
  { name: '頭獎', prize_type_id: null, value: 1000, quantity: 1 },
];

const SAMPLE_NAMES = ['人員A', '人員B', '人員C', '人員D', '人員E', '人員F'];

export default function QuickDraw() {
  const [activeStep, setActiveStep] = useState(0);
  const [eventName, setEventName] = useState(`${new Date().getFullYear()} 抽獎活動`);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));
  const [allowRepeatWin, setAllowRepeatWin] = useState(false);
  const [participants, setParticipants] = useState(DEFAULT_PARTICIPANTS);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [drawResults, setDrawResults] = useState([]);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [expandedPrize, setExpandedPrize] = useState(null);
  const [prizeTypes, setPrizeTypes] = useState([]);

  useEffect(() => {
    loadPastEvents();
    loadPrizeTypes();
  }, []);

  const loadPrizeTypes = async () => {
    try {
      const response = await adminApi.getPrizeTypes();
      setPrizeTypes(response.data);
    } catch (err) {
      console.error('載入獎品類型失敗:', err);
    }
  };

  const loadPastEvents = async () => {
    try {
      const response = await adminApi.getEvents();
      setPastEvents(response.data.filter(e => e.status !== 'draft' || e.prizes_count > 0));
    } catch (err) {
      console.error('載入過去活動失敗:', err);
    }
  };

  // Participant handlers
  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', employee_id: '', phone: '', email: '' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const fillSampleData = () => {
    const filled = participants.map((p, i) => ({
      ...p,
      name: p.name || SAMPLE_NAMES[i % SAMPLE_NAMES.length],
      employee_id: p.employee_id || `E${String(i + 1).padStart(3, '0')}`,
    }));
    setParticipants(filled);
  };

  const fillSamplePrizes = () => {
    const defaultTypeId = prizeTypes.find(pt => pt.code === 'gift')?.id || prizeTypes[0]?.id || null;
    setPrizes(SAMPLE_PRIZES.map(p => ({ ...p, prize_type_id: defaultTypeId })));
  };

  // Prize handlers
  const handlePrizeChange = (index, field, value) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const addPrize = () => {
    const position = prizes.length + 1;
    const defaultTypeId = prizeTypes.find(pt => pt.code === 'gift')?.id || prizeTypes[0]?.id || null;
    setPrizes([...prizes, { name: `${position}獎`, prize_type_id: defaultTypeId, value: 100, quantity: 1 }]);
  };

  const removePrize = (index) => {
    if (prizes.length > 1) {
      setPrizes(prizes.filter((_, i) => i !== index));
    }
  };

  // Copy from past event
  const handleCopyFromEvent = async (event) => {
    try {
      const response = await adminApi.getEvent(event.id);
      const eventData = response.data;

      setEventName(`${eventData.name} (複製)`);
      setAllowRepeatWin(eventData.allow_repeat_win);

      if (eventData.prizes && eventData.prizes.length > 0) {
        setPrizes(eventData.prizes.map(p => ({
          name: p.name,
          prize_type_id: p.prize_type_id,
          value: p.value,
          quantity: p.quantity,
        })));
      }

      if (eventData.participants && eventData.participants.length > 0) {
        setParticipants(eventData.participants.slice(0, 20).map(p => ({
          name: p.name || '',
          employee_id: p.employee_id || '',
          phone: p.phone || '',
          email: p.email || '',
        })));
      }

      setShowCopyDialog(false);
      setSuccess('已從過去活動複製設定！');
    } catch (err) {
      setError('複製失敗：' + (err.response?.data?.error || err.message));
    }
  };

  // Create event and start draw
  const handleCreateAndDraw = async () => {
    const validParticipants = participants.filter(p => p.name.trim());
    if (validParticipants.length === 0) {
      setError('請至少新增一位參與者');
      return;
    }

    const validPrizes = prizes.filter(p => p.name.trim() && p.quantity > 0);
    if (validPrizes.length === 0) {
      setError('請至少新增一個獎項');
      return;
    }

    const totalPrizeCount = validPrizes.reduce((sum, p) => sum + p.quantity, 0);
    if (totalPrizeCount > validParticipants.length && !allowRepeatWin) {
      setError(`獎項總數 (${totalPrizeCount}) 超過參與者人數 (${validParticipants.length})，請減少獎項或允許重複中獎`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create event
      const eventResponse = await adminApi.createEvent({
        name: eventName,
        event_date: eventDate,
        allow_repeat_win: allowRepeatWin,
        required_fields: ['name'],
        display_fields: ['name'],
        privacy_enabled: false,
      });
      const event = eventResponse.data;

      // 2. Create participants
      for (const p of validParticipants) {
        try {
          const participantResponse = await adminApi.createParticipant({
            name: p.name,
            employee_id: p.employee_id || null,
            phone: p.phone || null,
            email: p.email || null,
          });
          await adminApi.addParticipantToEvent(event.id, participantResponse.data.id);
        } catch (err) {
          // If participant exists, try to find and add
          if (err.response?.status === 422 && p.employee_id) {
            const existingResponse = await adminApi.getAllParticipants({ search: p.employee_id });
            if (existingResponse.data.length > 0) {
              await adminApi.addParticipantToEvent(event.id, existingResponse.data[0].id);
            }
          }
        }
      }

      // 3. Create prizes
      for (let i = 0; i < validPrizes.length; i++) {
        const prize = validPrizes[i];
        await adminApi.createPrize(event.id, {
          name: prize.name,
          prize_type_id: prize.prize_type_id,
          value: prize.value,
          quantity: prize.quantity,
          position: i + 1,
          display_fields: ['name'],
          privacy_settings: { name: false },
        });
      }

      // 4. Publish event
      await adminApi.publishEvent(event.id);

      // 5. Reload event to get prizes with IDs
      const updatedEvent = await adminApi.getEvent(event.id);
      setCreatedEvent(updatedEvent.data);
      setActiveStep(3);
      setSuccess('活動建立成功！可以開始抽獎了');
    } catch (err) {
      setError('建立活動失敗：' + (err.response?.data?.errors?.join(', ') || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Execute draw for a prize
  const handleDraw = async (prize) => {
    if (!createdEvent) return;

    setLoading(true);
    try {
      const response = await adminApi.executeDraw(prize.id, prize.quantity);
      const winners = response.data.winners || [];

      setDrawResults(prev => [
        ...prev,
        { prize, winners, drawnAt: new Date() }
      ]);

      // Reload event
      const updatedEvent = await adminApi.getEvent(createdEvent.id);
      setCreatedEvent(updatedEvent.data);
    } catch (err) {
      setError('抽獎失敗：' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Draw all at once
  const handleDrawAll = async () => {
    if (!createdEvent) return;

    const undrawnPrizes = createdEvent.prizes.filter(p => !p.drawn);
    for (const prize of undrawnPrizes) {
      await handleDraw(prize);
    }
  };

  const getValidParticipantCount = () => participants.filter(p => p.name.trim()).length;
  const getTotalPrizeCount = () => prizes.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const steps = [
    { label: '活動設定', description: '設定活動名稱與基本選項' },
    { label: '參與者', description: '新增抽獎參與者' },
    { label: '獎項設定', description: '設定獎項與數量' },
    { label: '開始抽獎', description: '執行抽獎並查看結果' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          快速建立抽獎活動
        </Typography>
        <Button
          variant="outlined"
          startIcon={<CopyIcon />}
          onClick={() => setShowCopyDialog(true)}
        >
          從過去活動複製
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Horizontal Stepper at top */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label} completed={index < activeStep || (index === 3 && createdEvent)}>
            <StepButton onClick={() => {
              // Only allow going back or to completed steps
              if (index <= activeStep || (index === 3 && createdEvent)) {
                setActiveStep(index);
              }
            }}>
              <StepLabel
                optional={
                  index === 1 ? <Typography variant="caption">{getValidParticipantCount()} 人</Typography> :
                  index === 2 ? <Typography variant="caption">{prizes.length} 個獎項</Typography> :
                  null
                }
              >
                {step.label}
              </StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>

      {/* Step Content Panels */}
      <Paper sx={{ p: 3 }}>
        {/* Step 1: Event Settings */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>{steps[0].label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {steps[0].description}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
              <TextField
                fullWidth
                label="活動名稱"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
              <TextField
                fullWidth
                label="活動日期"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={allowRepeatWin}
                    onChange={(e) => setAllowRepeatWin(e.target.checked)}
                  />
                }
                label="允許重複中獎（同一人可中多個獎項）"
              />
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" onClick={() => setActiveStep(1)}>
                  下一步：新增參與者
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 2: Participants */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>{steps[1].label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {steps[1].description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addParticipant}
              >
                新增參與者
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fillSampleData}
              >
                填入範例資料
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflow: 'auto', pr: 1 }}>
              {participants.map((p, index) => (
                <Card key={index} variant="outlined" sx={{ p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 30 }}>
                      #{index + 1}
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="姓名 *"
                      value={p.name}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      sx={{ flex: 1 }}
                      required
                    />
                    <TextField
                      size="small"
                      placeholder="員工編號"
                      value={p.employee_id}
                      onChange={(e) => handleParticipantChange(index, 'employee_id', e.target.value)}
                      sx={{ width: 120 }}
                    />
                    <TextField
                      size="small"
                      placeholder="電話"
                      value={p.phone}
                      onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                      sx={{ width: 120 }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeParticipant(index)}
                      disabled={participants.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>
                上一步
              </Button>
              <Button variant="contained" onClick={() => setActiveStep(2)}>
                下一步：設定獎項
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Prizes */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>{steps[2].label}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {steps[2].description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addPrize}
              >
                新增獎項
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fillSamplePrizes}
              >
                填入範例資料
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {prizes.map((prize, index) => (
                <Card key={index} variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PrizeIcon color="warning" />
                    <TextField
                      size="small"
                      label="獎項名稱"
                      value={prize.name}
                      onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>類型</InputLabel>
                      <Select
                        value={prize.prize_type_id || ''}
                        label="類型"
                        onChange={(e) => handlePrizeChange(index, 'prize_type_id', e.target.value)}
                      >
                        {prizeTypes.map((pt) => (
                          <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="價值"
                      type="number"
                      value={prize.value}
                      onChange={(e) => handlePrizeChange(index, 'value', parseInt(e.target.value) || 0)}
                      sx={{ width: 100 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                    <TextField
                      size="small"
                      label="數量"
                      type="number"
                      value={prize.quantity}
                      onChange={(e) => handlePrizeChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      sx={{ width: 80 }}
                      inputProps={{ min: 1 }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removePrize(index)}
                      disabled={prizes.length <= 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>

            {getTotalPrizeCount() > getValidParticipantCount() && !allowRepeatWin && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                獎項總數 ({getTotalPrizeCount()}) 超過參與者人數 ({getValidParticipantCount()})，
                請減少獎項數量或啟用「允許重複中獎」
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(1)}>
                上一步
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<DrawIcon />}
                onClick={handleCreateAndDraw}
                disabled={loading || getValidParticipantCount() === 0}
              >
                {loading ? '建立中...' : '建立活動並開始抽獎'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Draw */}
        {activeStep === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>{steps[3].label}</Typography>
            {createdEvent && (
              <Box>
                <Alert severity="success" icon={<CelebrationIcon />} sx={{ mb: 3 }}>
                  活動「{createdEvent.name}」已建立！共 {createdEvent.participants_count} 位參與者，{createdEvent.prizes_count} 個獎項
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<DrawIcon />}
                    onClick={handleDrawAll}
                    disabled={loading || createdEvent.prizes.every(p => p.drawn)}
                  >
                    一鍵全部抽獎
                  </Button>
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  獎項列表
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {createdEvent.prizes.map((prize) => {
                    const result = drawResults.find(r => r.prize.id === prize.id);
                    return (
                      <Card key={prize.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <PrizeIcon color={prize.drawn ? 'success' : 'warning'} />
                              <Box>
                                <Typography variant="subtitle1">
                                  {prize.name}
                                  {prize.drawn && (
                                    <Chip
                                      size="small"
                                      icon={<CheckCircleIcon />}
                                      label="已抽出"
                                      color="success"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  價值 ${prize.value} × {prize.quantity} 份
                                </Typography>
                              </Box>
                            </Box>
                            {!prize.drawn && (
                              <Button
                                variant="outlined"
                                startIcon={<DrawIcon />}
                                onClick={() => handleDraw(prize)}
                                disabled={loading}
                              >
                                抽獎
                              </Button>
                            )}
                          </Box>

                          {result && result.winners.length > 0 && (
                            <Box sx={{ mt: 2, pl: 5 }}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                中獎者：
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {result.winners.map((winner, i) => (
                                  <Chip
                                    key={i}
                                    icon={<CelebrationIcon />}
                                    label={winner.participant?.name || winner.participant_name || '未知'}
                                    color="success"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>

                {createdEvent.prizes.every(p => p.drawn) && (
                  <Alert severity="success" icon={<CelebrationIcon />} sx={{ mt: 3 }}>
                    🎉 所有獎項都已抽出！抽獎活動完成！
                  </Alert>
                )}
              </Box>
            )}
            {!createdEvent && (
              <Alert severity="info">
                請先完成前面步驟並建立活動
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Copy from past event dialog */}
      <Dialog open={showCopyDialog} onClose={() => setShowCopyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>從過去活動複製</DialogTitle>
        <DialogContent>
          {pastEvents.length === 0 ? (
            <Typography color="text.secondary">沒有可複製的過去活動</Typography>
          ) : (
            <List>
              {pastEvents.map((event) => (
                <ListItem
                  key={event.id}
                  button
                  onClick={() => handleCopyFromEvent(event)}
                  sx={{ borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemText
                    primary={event.name}
                    secondary={`${event.prizes_count} 個獎項 · ${event.participants_count} 位參與者`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCopyDialog(false)}>取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
