import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
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

export default function NotificationTemplateEditor({ smsTemplate, emailTemplate, onChange }) {
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const smsInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Template selection
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedSmsTemplateId, setSelectedSmsTemplateId] = useState('');
  const [selectedEmailTemplateId, setSelectedEmailTemplateId] = useState('');

  // Load notification templates
  useEffect(() => {
    adminApi.getNotificationTemplates({ notification_type: 'winning', method: 'sms' })
      .then(res => setSmsTemplates(res.data))
      .catch(() => setSmsTemplates([]));
    adminApi.getNotificationTemplates({ notification_type: 'winning', method: 'email' })
      .then(res => setEmailTemplates(res.data))
      .catch(() => setEmailTemplates([]));
  }, []);

  const handleTemplateChange = (type, value) => {
    onChange?.(type, value);
  };

  // Handle template selection
  const handleSmsTemplateSelect = (templateId) => {
    setSelectedSmsTemplateId(templateId);
    if (templateId) {
      const template = smsTemplates.find(t => t.id === templateId);
      if (template) {
        handleTemplateChange('sms_template', template.content);
      }
    }
  };

  const handleEmailTemplateSelect = (templateId) => {
    setSelectedEmailTemplateId(templateId);
    if (templateId) {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) {
        handleTemplateChange('email_template', template.content);
      }
    }
  };

  const generatePreview = (template) => {
    if (!template) return '';
    let preview = template;
    TEMPLATE_VARIABLES.forEach((v) => {
      preview = preview.replaceAll(`{${v.name}}`, v.example);
    });
    return preview;
  };

  const insertVariable = (field, varName) => {
    const variable = `{${varName}}`;
    const inputRef = field === 'sms' ? smsInputRef : emailInputRef;
    const currentValue = field === 'sms' ? smsTemplate : emailTemplate;
    const templateKey = field === 'sms' ? 'sms_template' : 'email_template';

    const input = inputRef.current?.querySelector('textarea');
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = (currentValue || '').substring(0, start) + variable + (currentValue || '').substring(end);
      handleTemplateChange(templateKey, newValue);

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      handleTemplateChange(templateKey, (currentValue || '') + variable);
    }
  };

  const handleKeyDown = (field) => (e) => {
    if (e.key === 'Tab') {
      const currentValue = field === 'sms' ? smsTemplate : emailTemplate;
      const placeholder = field === 'sms' ? SMS_PLACEHOLDER : EMAIL_PLACEHOLDER;
      const templateKey = field === 'sms' ? 'sms_template' : 'email_template';

      if (!currentValue?.trim()) {
        e.preventDefault();
        handleTemplateChange(templateKey, placeholder);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        通知模板設定
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        設定中獎通知的簡訊和 Email 模板，發放獎品時可選擇發送通知
      </Typography>

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

      {/* SMS Template */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SmsIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2">簡訊模板</Typography>
        </Box>

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
              placeholder={SMS_PLACEHOLDER + ' (按 Tab 自動帶入)'}
              value={smsTemplate || ''}
              onChange={(e) => handleTemplateChange('sms_template', e.target.value)}
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
            {(smsTemplate || '').length} 字
          </Typography>
        </Box>
      </Paper>

      {/* Email Template */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <EmailIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2">Email 模板</Typography>
        </Box>

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
              rows={6}
              size="small"
              placeholder={EMAIL_PLACEHOLDER + '\n\n(按 Tab 自動帶入)'}
              value={emailTemplate || ''}
              onChange={(e) => handleTemplateChange('email_template', e.target.value)}
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
      </Paper>
    </Box>
  );
}
