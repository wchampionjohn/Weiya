import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  Chip,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Sms as SmsIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Visibility as PreviewIcon,
  VisibilityOff as PreviewOffIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

const TEMPLATE_VARIABLES = [
  { name: 'name', label: '得獎者姓名', example: '王小明' },
  { name: 'prize', label: '獎項名稱', example: 'iPhone 15 Pro' },
  { name: 'value', label: '獎項價值', example: '35000' },
  { name: 'event_name', label: '活動名稱', example: '2025 尾牙抽獎活動' },
  { name: 'employee_id', label: '員工編號', example: 'EMP001' },
  { name: 'phone', label: '電話', example: '0912345678' },
  { name: 'email', label: 'Email', example: 'user@example.com' },
  { name: 'department', label: '部門', example: 'Engineering' },
];

const SMS_PLACEHOLDER = '恭喜 {name}！您在 {event_name} 中獲得 {prize}，請至人資部門領取。';
const EMAIL_PLACEHOLDER = `親愛的 {name}，

恭喜您在 {event_name} 中獲得 {prize}！
獎項價值：{value} 元

請至人資部門領取您的獎品。`;

export default function BatchDistributeDialog({ open, selectedWinners, event, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [smsTemplate, setSmsTemplate] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('');

  const smsInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Template selection
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

  // Initialize templates from event when dialog opens
  useEffect(() => {
    if (open && event) {
      setSmsTemplate(event.sms_template || '');
      setEmailTemplate(event.email_template || '');
      setSelectedSmsTemplateId('');
      setSelectedEmailTemplateId('');
    }
  }, [open, event]);


  // Handle template selection
  const handleSmsTemplateSelect = (templateId) => {
    setSelectedSmsTemplateId(templateId);
    if (templateId) {
      const template = smsTemplates.find(t => t.id === templateId);
      if (template) {
        setSmsTemplate(template.content);
      }
    }
  };

  const handleEmailTemplateSelect = (templateId) => {
    setSelectedEmailTemplateId(templateId);
    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) {
        setEmailTemplate(template.content);
      }
    }
  };

  const handleSubmit = async (action) => {
    // action: 'notify_only', 'distribute_only', 'distribute_and_notify'
    if (!selectedWinners || selectedWinners.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const shouldDistribute = action === 'distribute_only' || action === 'distribute_and_notify';
      const shouldNotify = action === 'notify_only' || action === 'distribute_and_notify';

      const options = {
        winner_ids: selectedWinners.map(w => w.id),
        distribute: shouldDistribute,
        send_sms: shouldNotify && sendSms,
        send_email: shouldNotify && sendEmail,
        sms_template: shouldNotify && sendSms ? smsTemplate : null,
        email_template: shouldNotify && sendEmail ? emailTemplate : null,
      };
      const result = await adminApi.batchDistributeWinners(options);
      onSuccess(result.data);
    } catch (err) {
      setError(err.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (field, varName) => {
    const variable = `{${varName}}`;
    const inputRef = field === 'sms' ? smsInputRef : emailInputRef;
    const setValue = field === 'sms' ? setSmsTemplate : setEmailTemplate;
    const currentValue = field === 'sms' ? smsTemplate : emailTemplate;

    const input = inputRef.current?.querySelector('textarea');
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      setValue(newValue);

      // Restore cursor position after the inserted variable
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setValue(prev => prev + variable);
    }
  };

  // Generate preview with sample data
  const generatePreview = (template) => {
    if (!template) return '';
    let preview = template;
    TEMPLATE_VARIABLES.forEach((v) => {
      preview = preview.replaceAll(`{${v.name}}`, v.example);
    });
    return preview;
  };

  // Handle Tab key to auto-fill placeholder
  const handleKeyDown = (field) => (e) => {
    if (e.key === 'Tab') {
      const currentValue = field === 'sms' ? smsTemplate : emailTemplate;
      const placeholder = field === 'sms' ? SMS_PLACEHOLDER : EMAIL_PLACEHOLDER;
      const setValue = field === 'sms' ? setSmsTemplate : setEmailTemplate;

      if (!currentValue.trim()) {
        e.preventDefault();
        setValue(placeholder);
      }
    }
  };

  const undistributedCount = selectedWinners?.filter(w => !w.distributed).length || 0;
  const alreadyDistributedCount = selectedWinners?.filter(w => w.distributed).length || 0;

  // Count recipients without contact info
  const winnersWithoutPhone = selectedWinners?.filter(w => !w.distributed && !w.participant?.phone).length || 0;
  const winnersWithoutEmail = selectedWinners?.filter(w => !w.distributed && !w.participant?.email).length || 0;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>批次發放確認</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            您選取了 <strong>{selectedWinners?.length || 0}</strong> 筆中獎記錄
          </Typography>

          {undistributedCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              • 將發放：<strong>{undistributedCount}</strong> 筆
            </Typography>
          )}

          {alreadyDistributedCount > 0 && (
            <Typography variant="body2" color="warning.main">
              • 已發放（將略過）：<strong>{alreadyDistributedCount}</strong> 筆
            </Typography>
          )}
        </Box>

        {undistributedCount === 0 ? (
          <Alert severity="warning">
            所有選取的記錄都已發放過，無需再次操作。
          </Alert>
        ) : (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Notification Options */}
            <Typography variant="subtitle2" gutterBottom>
              通知選項
            </Typography>

            {/* Variable Help */}
            <Accordion sx={{ mb: 2 }} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 40 }}>
                <HelpIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2">變數說明</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Chip
                      key={v.name}
                      label={`{${v.name}} ${v.label}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* SMS Option */}
            <Box sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmsIcon fontSize="small" />
                    <span>發送簡訊通知</span>
                    {winnersWithoutPhone > 0 && (
                      <Chip
                        size="small"
                        label={`${winnersWithoutPhone} 人無電話`}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <Collapse in={sendSms}>
                <Box sx={{ mt: 2, pl: 4 }}>
                  {/* Template Selector */}
                  {smsTemplates.length > 0 && (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>快速選擇模板</InputLabel>
                      <Select
                        value={selectedSmsTemplateId}
                        label="快速選擇模板"
                        onChange={(e) => handleSmsTemplateSelect(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>自訂內容</em>
                        </MenuItem>
                        {smsTemplates.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Box sx={{ position: 'relative' }}>
                    {showSmsPreview && smsTemplate ? (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 100, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          預覽：
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {generatePreview(smsTemplate)}
                        </Typography>
                      </Box>
                    ) : (
                      <TextField
                        ref={smsInputRef}
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        label="簡訊內容"
                        placeholder={SMS_PLACEHOLDER + ' (按 Tab 自動帶入)'}
                        value={smsTemplate}
                        onChange={(e) => setSmsTemplate(e.target.value)}
                        onKeyDown={handleKeyDown('sms')}
                      />
                    )}
                    {smsTemplate && (
                      <Tooltip title={showSmsPreview ? '編輯' : '預覽'}>
                        <IconButton
                          size="small"
                          onClick={() => setShowSmsPreview(!showSmsPreview)}
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          {showSmsPreview ? <PreviewOffIcon fontSize="small" /> : <PreviewIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        可用變數：
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {TEMPLATE_VARIABLES.map((v) => (
                          <Chip
                            key={v.name}
                            label={`{${v.name}}`}
                            size="small"
                            onClick={() => insertVariable('sms', v.name)}
                            sx={{ cursor: 'pointer', height: 20 }}
                          />
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                      {smsTemplate.length} 字
                    </Typography>
                  </Box>
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
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" />
                    <span>發送 Email 通知</span>
                    {winnersWithoutEmail > 0 && (
                      <Chip
                        size="small"
                        label={`${winnersWithoutEmail} 人無 Email`}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <Collapse in={sendEmail}>
                <Box sx={{ mt: 2, pl: 4 }}>
                  {/* Template Selector */}
                  {emailTemplates.length > 0 && (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>快速選擇模板</InputLabel>
                      <Select
                        value={selectedEmailTemplateId}
                        label="快速選擇模板"
                        onChange={(e) => handleEmailTemplateSelect(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>自訂內容</em>
                        </MenuItem>
                        {emailTemplates.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <Box sx={{ position: 'relative' }}>
                    {showEmailPreview && emailTemplate ? (
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 150, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          預覽：
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {generatePreview(emailTemplate)}
                        </Typography>
                      </Box>
                    ) : (
                      <TextField
                        ref={emailInputRef}
                        fullWidth
                        multiline
                        rows={5}
                        size="small"
                        label="Email 內容"
                        placeholder={EMAIL_PLACEHOLDER + '\n\n(按 Tab 自動帶入)'}
                        value={emailTemplate}
                        onChange={(e) => setEmailTemplate(e.target.value)}
                        onKeyDown={handleKeyDown('email')}
                      />
                    )}
                    {emailTemplate && (
                      <Tooltip title={showEmailPreview ? '編輯' : '預覽'}>
                        <IconButton
                          size="small"
                          onClick={() => setShowEmailPreview(!showEmailPreview)}
                          sx={{ position: 'absolute', top: 8, right: 8 }}
                        >
                          {showEmailPreview ? <PreviewOffIcon fontSize="small" /> : <PreviewIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      可用變數：
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {TEMPLATE_VARIABLES.map((v) => (
                        <Chip
                          key={v.name}
                          label={`{${v.name}}`}
                          size="small"
                          onClick={() => insertVariable('email', v.name)}
                          sx={{ cursor: 'pointer', height: 20 }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </Box>

          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Box sx={{ flex: 1 }} />
        {(sendSms || sendEmail) && (
          <Button
            onClick={() => handleSubmit('notify_only')}
            variant="outlined"
            color="info"
            disabled={loading || undistributedCount === 0 || (!sendSms && !sendEmail)}
            startIcon={loading && <CircularProgress size={16} />}
          >
            通知
          </Button>
        )}
        <Button
          onClick={() => handleSubmit('distribute_only')}
          variant="outlined"
          color="success"
          disabled={loading || undistributedCount === 0}
          startIcon={loading && <CircularProgress size={16} />}
        >
          標註發放
        </Button>
        {(sendSms || sendEmail) && (
          <Button
            onClick={() => handleSubmit('distribute_and_notify')}
            variant="contained"
            color="success"
            disabled={loading || undistributedCount === 0 || (!sendSms && !sendEmail)}
            startIcon={loading && <CircularProgress size={16} />}
          >
            發放並通知
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
