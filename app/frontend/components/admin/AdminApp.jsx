import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Breadcrumbs,
  Link,
  Paper,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Menu as MenuIcon,
  EmojiEvents as PrizeIcon,
  People as PeopleIcon,
  Casino as DrawIcon,
  WorkspacePremium as WinnerIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Publish as PublishIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  FlashOn as QuickDrawIcon,
  Category as CategoryIcon,
  CheckCircle as CompleteIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import GlobalLoading from './GlobalLoading';
import EventList from './EventList';
import EventForm from './EventForm';
import PrizeManager from './PrizeManager';
import ParticipantList from './ParticipantList';
import DrawControl from './DrawControl';
import WinnerManagement from './WinnerManagement';
import ParticipantManagement from './ParticipantManagement';
import QuickDraw from './QuickDraw';
import PrizeTypesManager from './PrizeTypesManager';
import NotificationTemplatesManager from './NotificationTemplatesManager';
import { adminApi } from '../../lib/api';

const drawerWidth = 260;

// Event detail page with tabs
function EventDetail({ showSnackbar }) {
  const { eventId, tab = 'settings', prizeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventDetails, setEventDetails] = useState(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Detect if we're on prize edit/new route
  const isPrizeEditRoute = location.pathname.includes('/prizes/') && (location.pathname.endsWith('/edit') || prizeId);
  const isPrizeNewRoute = location.pathname.endsWith('/prizes/new');
  const effectiveTab = (isPrizeEditRoute || isPrizeNewRoute) ? 'prizes' : tab;

  const loadEventDetails = async () => {
    try {
      const response = await adminApi.getEvent(eventId);
      setEventDetails(response.data);
    } catch (err) {
      console.error('載入活動詳情失敗:', err);
      showSnackbar('載入活動詳情失敗', 'error');
    }
  };

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const handlePublish = async () => {
    try {
      await adminApi.publishEvent(eventId);
      await loadEventDetails();
      showSnackbar('活動已發佈！');
    } catch (err) {
      showSnackbar(err.response?.data?.error || '發佈失敗', 'error');
    }
  };

  const handleComplete = async () => {
    setCompleteDialogOpen(false);
    try {
      await adminApi.completeEvent(eventId);
      await loadEventDetails();
      showSnackbar('活動已完成！');
    } catch (err) {
      showSnackbar(err.response?.data?.error || '完成失敗', 'error');
    }
  };

  if (!eventDetails) {
    return null; // GlobalLoading handles the loading state
  }

  return (
    <Box>
      {eventDetails.status === 'draft' && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PublishIcon />}
            onClick={handlePublish}
          >
            發佈活動
          </Button>
        </Box>
      )}

      {eventDetails.can_complete && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="info"
            startIcon={<CompleteIcon />}
            onClick={() => setCompleteDialogOpen(true)}
          >
            結束活動
          </Button>
        </Box>
      )}

      <Dialog
        open={completeDialogOpen}
        onClose={() => setCompleteDialogOpen(false)}
      >
        <DialogTitle>確認結束活動</DialogTitle>
        <DialogContent>
          <DialogContentText>
            結束活動後將無法再進行任何異動，包括獎項設定、參與者管理、抽獎操作等。
            <br /><br />
            確定要結束此活動嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>
            取消
          </Button>
          <Button onClick={handleComplete} color="info" variant="contained">
            確認結束
          </Button>
        </DialogActions>
      </Dialog>

      {effectiveTab === 'settings' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            活動設定
          </Typography>
          <EventForm
            event={eventDetails}
            onSave={() => { loadEventDetails(); showSnackbar('活動設定已更新！'); }}
            onCancel={() => navigate(`/admin/events/${eventId}/prizes`)}
          />
        </Paper>
      )}

      {effectiveTab === 'prizes' && (
        <PrizeManager
          event={eventDetails}
          prizes={eventDetails.prizes}
          onUpdate={loadEventDetails}
          editPrizeId={isPrizeEditRoute ? prizeId : null}
          isNewPrize={isPrizeNewRoute}
          showSnackbar={showSnackbar}
        />
      )}

      {effectiveTab === 'participants' && (
        <ParticipantList
          event={eventDetails}
          onUpdate={loadEventDetails}
          showSnackbar={showSnackbar}
        />
      )}

      {effectiveTab === 'draw' && (
        <DrawControl
          event={eventDetails}
          prizes={eventDetails.prizes}
          onUpdate={loadEventDetails}
        />
      )}

      {effectiveTab === 'winners' && (
        <WinnerManagement eventId={eventDetails.id} event={eventDetails} />
      )}
    </Box>
  );
}

function AdminContent() {
  const { isAuthenticated, admin, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentEvent, setCurrentEvent] = useState(null);

  // Parse current route to determine active section
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isEventPage = pathParts[1] === 'events' && pathParts[2];
  const eventId = isEventPage ? pathParts[2] : null;
  const activeTab = pathParts[3] || 'settings';

  // Load event details when on event page
  useEffect(() => {
    if (eventId) {
      adminApi.getEvent(eventId)
        .then(res => setCurrentEvent(res.data))
        .catch(() => setCurrentEvent(null));
    } else {
      setCurrentEvent(null);
    }
  }, [eventId]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  if (authLoading) {
    return null; // GlobalLoading handles this
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => navigate('/admin')} />;
  }

  const handleEventSelect = (event) => {
    navigate(`/admin/events/${event.id}/settings`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'active': return 'success';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'active': return '進行中';
      case 'completed': return '已完成';
      default: return status;
    }
  };

  const eventTabs = [
    { id: 'settings', label: '活動設定', icon: <SettingsIcon /> },
    { id: 'prizes', label: '獎項', icon: <PrizeIcon /> },
    { id: 'participants', label: '參與者', icon: <PeopleIcon /> },
    { id: 'draw', label: '抽獎', icon: <DrawIcon /> },
    { id: 'winners', label: '得獎者', icon: <WinnerIcon /> },
  ];

  // Common styles for menu items with highlight effect
  const menuItemSx = {
    borderRadius: 2,
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'white',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
      '& .MuiListItemIcon-root': {
        color: 'white',
      },
    },
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 700, color: 'primary.main' }}>
          抽獎管理系統
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1 }}>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/admin"
            selected={location.pathname === '/admin' || location.pathname === '/admin/'}
            sx={menuItemSx}
          >
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="所有活動" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/admin/quick-draw"
            selected={location.pathname === '/admin/quick-draw'}
            sx={menuItemSx}
          >
            <ListItemIcon><QuickDrawIcon /></ListItemIcon>
            <ListItemText primary="快速抽獎" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/admin/participants"
            selected={location.pathname === '/admin/participants'}
            sx={menuItemSx}
          >
            <ListItemIcon><GroupIcon /></ListItemIcon>
            <ListItemText primary="參與者管理" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/admin/prize-types"
            selected={location.pathname === '/admin/prize-types'}
            sx={menuItemSx}
          >
            <ListItemIcon><CategoryIcon /></ListItemIcon>
            <ListItemText primary="獎品類型" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={RouterLink}
            to="/admin/notification-templates"
            selected={location.pathname === '/admin/notification-templates'}
            sx={menuItemSx}
          >
            <ListItemIcon><NotificationsIcon /></ListItemIcon>
            <ListItemText primary="通知模板" />
          </ListItemButton>
        </ListItem>
      </List>

      {currentEvent && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              目前活動
            </Typography>
            <Typography variant="subtitle2" noWrap sx={{ mt: 0.5 }}>
              {currentEvent.name}
            </Typography>
            <Chip
              size="small"
              label={getStatusLabel(currentEvent.status)}
              color={getStatusColor(currentEvent.status)}
              sx={{ mt: 1 }}
            />
          </Box>
          <List sx={{ px: 1 }}>
            {eventTabs.map((tab) => (
              <ListItem key={tab.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={RouterLink}
                  to={`/admin/events/${eventId}/${tab.id}`}
                  selected={isEventPage && activeTab === tab.id}
                  sx={menuItemSx}
                >
                  <ListItemIcon>{tab.icon}</ListItemIcon>
                  <ListItemText primary={tab.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  // Breadcrumb logic
  const getBreadcrumbs = () => {
    const crumbs = [
      <Link
        key="home"
        component={RouterLink}
        to="/admin"
        underline="hover"
        color="inherit"
      >
        活動列表
      </Link>
    ];

    if (location.pathname === '/admin/new') {
      crumbs.push(
        <Typography key="new" color="text.primary">新增活動</Typography>
      );
    } else if (location.pathname === '/admin/quick-draw') {
      crumbs.push(
        <Typography key="quick-draw" color="text.primary">快速抽獎</Typography>
      );
    } else if (location.pathname === '/admin/participants') {
      crumbs.push(
        <Typography key="participants" color="text.primary">參與者管理</Typography>
      );
    } else if (location.pathname === '/admin/prize-types') {
      crumbs.push(
        <Typography key="prize-types" color="text.primary">獎品類型</Typography>
      );
    } else if (location.pathname === '/admin/notification-templates') {
      crumbs.push(
        <Typography key="notification-templates" color="text.primary">通知模板</Typography>
      );
    } else if (currentEvent) {
      crumbs.push(
        <Typography key="event" color="text.primary">{currentEvent.name}</Typography>
      );
    }

    return crumbs;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Breadcrumbs aria-label="breadcrumb">
              {getBreadcrumbs()}
            </Breadcrumbs>
          </Box>

          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {admin?.email?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {admin?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              登出
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />

        <Routes>
          <Route index element={
            <EventList
              onSelect={handleEventSelect}
              onNew={() => navigate('/admin/new')}
            />
          } />
          <Route path="new" element={
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/admin')} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">新增活動</Typography>
              </Box>
              <EventForm
                onSave={() => { navigate('/admin'); showSnackbar('活動已建立！'); }}
                onCancel={() => navigate('/admin')}
              />
            </Paper>
          } />
          <Route path="participants" element={<ParticipantManagement />} />
          <Route path="quick-draw" element={<QuickDraw />} />
          <Route path="prize-types" element={<PrizeTypesManager />} />
          <Route path="notification-templates" element={<NotificationTemplatesManager />} />
          <Route path="events/:eventId/prizes/:prizeId/edit" element={<EventDetail showSnackbar={showSnackbar} />} />
          <Route path="events/:eventId/prizes/new" element={<EventDetail showSnackbar={showSnackbar} />} />
          <Route path="events/:eventId/:tab?" element={<EventDetail showSnackbar={showSnackbar} />} />
        </Routes>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AdminContent />
      <GlobalLoading />
    </AuthProvider>
  );
}
