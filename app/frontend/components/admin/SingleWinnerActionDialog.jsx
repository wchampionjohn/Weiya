import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  TextField,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Sms as SmsIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function SingleWinnerActionDialog({ open, winner, event, action, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [smsTemplate, setSmsTemplate] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedSmsTemplateId, setSelectedSmsTemplateId] = useState('');
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');

  // Load notification templates
  useEffect(() => {
    if (open) {
      adminApi.getNotificationTemplates({ notification_type: 'distribution', method: 'sms' })
        .then(res => setSmsTemplates(res.data))
        .catch(() => setSmsTemplates([]));
      adminApi.getNotificationTemplates({ notification_type: 'distribution', method: 'email' })
        .then(res => setEmailTemplates(res.data))
        .catch(() => setEmailTemplates([]));
    }
  }, [open]);

  // Initialize templates from event
  useEffect(() => {
    if (open && event) {
      setSmsTemplate(event.sms_template || '');
      setEmailTemplate(event.email_template || '');
      setSelectedSmsTemplateId('');
      setSelectedEmailTemplateId('');
      setError(null);
    }
  }, [open, event]);

  const handleSmsTemplateSelect = (templateId) => {
    setSelectedSmsTemplateId(templateId);
    if (templateId) {
      const template = smsTemplates.find(t => t.id === templateId);
      if (template) setSmsTemplate(template.content);
    }
  };

  const handleEmailTemplateSelect = (templateId) => {
    setSelectedEmailTemplateId(templateId);
    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) setEmailTemplate(template.content);
    }
  };

  const handleSubmit = async () => {
    if (!winner) return;

    setLoading(true);
    setError(null);

    try {
      const shouldDistribute = action === 'distribute_and_notify';

      const options = {
        winner_ids: [winner.id],
        distribute: shouldDistribute,
        send_sms: sendSms,
        send_email: sendEmail,
        sms_template: sendSms ? smsTemplate : null,
        email_template: sendEmail ? emailTemplate : null,
      };

      const result = await adminApi.batchDistributeWinners(options);
      onSuccess(result.data);
    } catch (err) {
      setError(err.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const participant = winner?.participant;
  const isNotifyOnly = action === 'notify_only';
  const title = isNotifyOnly ? '發送通知' : '發放並通知';
  const submitText = isNotifyOnly ? '發送通知' : '發放並通知';

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            得獎者：<strong>{participant?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            獎項：<strong>{winner?.prize?.name}</strong>
          </Typography>
        </Box>

        {/* SMS Option */}
        <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                disabled={!participant?.phone}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmsIcon fontSize="small" />
                <span>簡訊通知</span>
                {!participant?.phone && (
                  <Typography variant="caption" color="warning.main">（無電話）</Typography>
                )}
              </Box>
            }
          />
          <Collapse in={sendSms && !!participant?.phone}>
            <Box sx={{ mt: 2, pl: 4 }}>
              {smsTemplates.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>選擇模板</InputLabel>
                  <Select
                    value={selectedSmsTemplateId}
                    label="選擇模板"
                    onChange={(e) => handleSmsTemplateSelect(e.target.value)}
                  >
                    <MenuItem value=""><em>自訂內容</em></MenuItem>
                    {smsTemplates.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="簡訊內容"
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
              />
            </Box>
          </Collapse>
        </Box>

        {/* Email Option */}
        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={!participant?.email}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" />
                <span>Email 通知</span>
                {!participant?.email && (
                  <Typography variant="caption" color="warning.main">（無 Email）</Typography>
                )}
              </Box>
            }
          />
          <Collapse in={sendEmail && !!participant?.email}>
            <Box sx={{ mt: 2, pl: 4 }}>
              {emailTemplates.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>選擇模板</InputLabel>
                  <Select
                    value={selectedEmailTemplateId}
                    label="選擇模板"
                    onChange={(e) => handleEmailTemplateSelect(e.target.value)}
                  >
                    <MenuItem value=""><em>自訂內容</em></MenuItem>
                    {emailTemplates.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                label="Email 內容"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
              />
            </Box>
          </Collapse>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>取消</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || (!sendSms && !sendEmail)}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
