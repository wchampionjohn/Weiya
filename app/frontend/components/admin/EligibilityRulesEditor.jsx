import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
  Collapse,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Paper,
} from '@mui/material';
import {
  Info as InfoIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function EligibilityRulesEditor({ eventId, prizeId, value, onChange }) {
  const [enabled, setEnabled] = useState(() => {
    return value && Object.keys(value).length > 0;
  });
  const [seniorityInput, setSeniorityInput] = useState(() => {
    return value?.min_seniority_years?.toString() || '';
  });
  const [minSeniorityYears, setMinSeniorityYears] = useState(() => {
    return value?.min_seniority_years?.toString() || '';
  });
  const [selectedDepartments, setSelectedDepartments] = useState(() => {
    return value?.departments || [];
  });
  const [allDepartments, setAllDepartments] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Track if change is from user interaction
  const isUserChangeRef = useRef(false);

  // Debounce seniority input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (seniorityInput !== minSeniorityYears) {
        isUserChangeRef.current = true;
        setMinSeniorityYears(seniorityInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [seniorityInput]);

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await adminApi.getDepartments();
        setAllDepartments(response.data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    loadDepartments();
  }, []);

  // Build rules object from current state
  const buildRules = useCallback(() => {
    if (!enabled) return null;

    const rules = {};
    if (minSeniorityYears && parseInt(minSeniorityYears) > 0) {
      rules.min_seniority_years = parseInt(minSeniorityYears);
    }
    if (selectedDepartments.length > 0) {
      rules.departments = selectedDepartments;
    }
    return Object.keys(rules).length > 0 ? rules : null;
  }, [enabled, minSeniorityYears, selectedDepartments]);

  // Notify parent of changes (only when user makes changes)
  useEffect(() => {
    if (isUserChangeRef.current) {
      onChange(buildRules());
      isUserChangeRef.current = false;
    }
  }, [enabled, minSeniorityYears, selectedDepartments, buildRules, onChange]);

  useEffect(() => {
    if (eventId && enabled) {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [eventId, enabled, minSeniorityYears, selectedDepartments]);

  const loadPreview = async () => {
    if (!eventId) return;

    setLoadingPreview(true);
    try {
      const rules = buildRules() || {};
      const response = await adminApi.previewEligibleParticipants(eventId, rules);
      setPreview(response.data);
    } catch (err) {
      console.error('Failed to load eligible participants:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggle = (e) => {
    isUserChangeRef.current = true;
    setEnabled(e.target.checked);
    if (!e.target.checked) {
      setMinSeniorityYears('');
      setSelectedDepartments([]);
    }
  };

  const handleSeniorityChange = (e) => {
    const val = e.target.value;
    // Allow empty input for clearing
    if (val === '') {
      setSeniorityInput('');
      return;
    }
    // Validate range 1-30
    const numVal = parseInt(val, 10);
    if (!isNaN(numVal) && numVal >= 1 && numVal <= 30) {
      setSeniorityInput(val);
    }
  };

  const handleDepartmentChange = (event) => {
    isUserChangeRef.current = true;
    const { value } = event.target;
    setSelectedDepartments(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={handleToggle}
            color="primary"
          />
        }
        label={
          <Typography variant="subtitle2">
            啟用參與資格條件
          </Typography>
        }
      />

      <Collapse in={enabled}>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="最低年資 (年)"
            value={seniorityInput}
            onChange={handleSeniorityChange}
            inputProps={{ min: 1, max: 30 }}
            helperText="設定參與者需要的最低年資（1 ~ 30 年）"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>限定部門（留空表示不限制）</InputLabel>
            <Select
              multiple
              value={selectedDepartments}
              onChange={handleDepartmentChange}
              input={<OutlinedInput label="限定部門（留空表示不限制）" />}
              renderValue={(selected) => selected.join(', ')}
            >
              {allDepartments.map((dept) => (
                <MenuItem key={dept.id} value={dept.name}>
                  <Checkbox checked={selectedDepartments.includes(dept.name)} />
                  <ListItemText primary={dept.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {eventId && (
            <Box sx={{ mt: 2 }}>
              {loadingPreview ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">
                    計算符合資格人數...
                  </Typography>
                </Box>
              ) : preview ? (
                <>
                  <Alert
                    severity={preview.eligible_count > 0 ? 'info' : 'warning'}
                    icon={<InfoIcon fontSize="small" />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      共 {preview.total_count} 位參與者，
                      <strong>{preview.eligible_count}</strong> 位符合資格
                      {preview.eligible_count === 0 && ' - 請調整條件'}
                    </Typography>
                  </Alert>
                  {preview.participants && preview.participants.length > 0 && (minSeniorityYears || selectedDepartments.length > 0) && (() => {
                    const notWon = preview.participants.filter(p => !p.has_won);
                    const hasWon = preview.participants.filter(p => p.has_won);
                    return (
                      <Paper variant="outlined" sx={{ p: 1.5, maxHeight: 250, overflow: 'auto' }}>
                        {/* Not Won Section */}
                        {notWon.length > 0 && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              未中獎（{notWon.length} 位）：
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {notWon.map((p) => (
                                <Chip
                                  key={p.id}
                                  label={`${p.name} (${p.department || '無部門'}${p.seniority_years ? `, ${p.seniority_years}年` : ''})`}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </>
                        )}

                        {/* Already Won Section */}
                        {hasWon.length > 0 && (
                          <Box sx={{ mt: notWon.length > 0 ? 2 : 0, pt: notWon.length > 0 ? 1.5 : 0, borderTop: notWon.length > 0 ? 1 : 0, borderColor: 'divider' }}>
                            <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block' }}>
                              已中獎（{hasWon.length} 位）：
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {hasWon.map((p) => (
                                <Chip
                                  key={p.id}
                                  label={`${p.name} (${p.department || '無部門'}${p.seniority_years ? `, ${p.seniority_years}年` : ''})`}
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    );
                  })()}
                </>
              ) : null}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
