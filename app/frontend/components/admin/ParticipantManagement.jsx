import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  InputAdornment,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  TablePagination,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { adminApi } from '../../lib/api';

export default function ParticipantManagement() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formData, setFormData] = useState({ name: '', employee_id: '', phone: '', email: '', hire_date: '', department: '' });
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, participant: null });

  // Sort and filter state
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Debounce ref
  const debounceRef = useRef(null);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async (query = '') => {
    try {
      if (!query) setLoading(true);
      const response = await adminApi.getAllParticipants({ q: query });
      setParticipants(response.data);
      setError(null);
    } catch (err) {
      setError('載入參與者失敗');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  // Debounced search handler
  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page on search

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      loadParticipants(value);
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Calculate seniority years from hire date
  const calculateSeniority = (hireDate) => {
    if (!hireDate) return null;
    const hire = new Date(hireDate);
    const now = new Date();
    const years = (now - hire) / (365.25 * 24 * 60 * 60 * 1000);
    return Math.floor(years);
  };

  // Get unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set(participants.map(p => p.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [participants]);

  // Filtered and sorted participants (search is done via API)
  const displayedParticipants = useMemo(() => {
    let result = [...participants];

    // Department filter (client-side)
    if (departmentFilter !== 'all') {
      result = result.filter(p => p.department === departmentFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null values
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Handle numeric fields
      if (sortField === 'events_count') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      // Handle date fields
      if (sortField === 'hire_date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Compare
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [participants, departmentFilter, sortField, sortDirection]);

  // Paginated participants
  const paginatedParticipants = useMemo(() => {
    const start = page * rowsPerPage;
    return displayedParticipants.slice(start, start + rowsPerPage);
  }, [displayedParticipants, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenForm = (participant = null) => {
    if (participant) {
      setEditingParticipant(participant);
      setFormData({
        name: participant.name,
        employee_id: participant.employee_id || '',
        phone: participant.phone || '',
        email: participant.email || '',
        hire_date: participant.hire_date || '',
        department: participant.department || '',
      });
    } else {
      setEditingParticipant(null);
      setFormData({ name: '', employee_id: '', phone: '', email: '', hire_date: '', department: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingParticipant(null);
    setFormData({ name: '', employee_id: '', phone: '', email: '', hire_date: '', department: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingParticipant) {
        await adminApi.updateParticipant(editingParticipant.id, formData);
      } else {
        await adminApi.createParticipant(formData);
      }
      handleCloseForm();
      loadParticipants();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || '儲存失敗');
    }
  };

  const handleDeleteClick = (participant) => {
    setDeleteDialog({ open: true, participant });
  };

  const handleDeleteConfirm = async () => {
    const participantId = deleteDialog.participant?.id;
    setDeleteDialog({ open: false, participant: null });

    try {
      await adminApi.deleteParticipant(participantId);
      loadParticipants();
    } catch (err) {
      setError(err.response?.data?.error || '刪除失敗');
    }
  };

  if (loading && participants.length === 0) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          參與者管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          新增參與者
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="搜尋姓名、員工編號、電話、Email、部門..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searching && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>部門</InputLabel>
              <Select
                value={departmentFilter}
                label="部門"
                onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="all">全部部門</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {(searchQuery || departmentFilter !== 'all') && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              顯示 {displayedParticipants.length} / {participants.length} 位參與者
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingParticipant ? '編輯參與者' : '新增參與者'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="姓名"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="員工編號"
                  value={formData.employee_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="電話"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="到職日期"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  helperText="用於計算年資"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="部門"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  helperText="可用於資格條件篩選"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>取消</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
              儲存
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Participants Table */}
      {participants.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              尚無參與者
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              新增您的第一位參與者
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
              新增參與者
            </Button>
          </CardContent>
        </Card>
      ) : displayedParticipants.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              找不到符合的參與者
            </Typography>
            <Typography variant="body2" color="text.secondary">
              請嘗試其他搜尋條件
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    姓名
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'employee_id'}
                    direction={sortField === 'employee_id' ? sortDirection : 'asc'}
                    onClick={() => handleSort('employee_id')}
                  >
                    員工編號
                  </TableSortLabel>
                </TableCell>
                <TableCell>電話</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'department'}
                    direction={sortField === 'department' ? sortDirection : 'asc'}
                    onClick={() => handleSort('department')}
                  >
                    部門
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'hire_date'}
                    direction={sortField === 'hire_date' ? sortDirection : 'asc'}
                    onClick={() => handleSort('hire_date')}
                  >
                    到職日期
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'events_count'}
                    direction={sortField === 'events_count' ? sortDirection : 'asc'}
                    onClick={() => handleSort('events_count')}
                  >
                    參與活動數
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedParticipants.map((p) => {
                const seniority = calculateSeniority(p.hire_date);
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {p.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.employee_id || '-'}</TableCell>
                    <TableCell>{p.phone || '-'}</TableCell>
                    <TableCell>{p.email || '-'}</TableCell>
                    <TableCell>{p.department || '-'}</TableCell>
                    <TableCell>
                      {p.hire_date ? (
                        <>
                          {new Date(p.hire_date).toISOString().slice(0, 10)}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({seniority} 年)
                          </Typography>
                        </>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={`${p.events_count || 0} 個活動`} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenForm(p)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(p)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={displayedParticipants.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="每頁顯示"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, participant: null })}
      >
        <DialogTitle>刪除參與者</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除「{deleteDialog.participant?.name}」嗎？此操作無法復原。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, participant: null })}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
