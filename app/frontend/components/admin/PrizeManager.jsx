import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EmojiEvents as TrophyIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminApi } from '../../lib/api';
import PrizeForm from './PrizeForm';

function SortablePrizeItem({ prize, index, onEdit, onDelete, isDraft, formatCurrency, prizeTypeLabel }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prize.id, disabled: !isDraft || prize.drawn });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        bgcolor: prize.drawn ? 'success.50' : 'background.paper',
        border: 1,
        borderColor: prize.drawn ? 'success.light' : 'grey.200',
        borderRadius: 1,
        mb: 1,
      }}
      secondaryAction={
        !prize.drawn && isDraft && (
          <Box>
            <IconButton size="small" color="primary" onClick={() => onEdit(prize)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(prize)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    >
      {isDraft && !prize.drawn && (
        <Box
          {...attributes}
          {...listeners}
          sx={{ mr: 1, cursor: 'grab', color: 'text.secondary', display: 'flex', alignItems: 'center' }}
        >
          <DragIcon />
        </Box>
      )}
      <Box sx={{ mr: 2, minWidth: 32, textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: prize.drawn ? 'success.main' : 'primary.main',
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
            <Typography variant="subtitle2">{prize.name}</Typography>
            {prize.drawn && (
              <Chip size="small" label="已抽出" color="success" sx={{ height: 20 }} />
            )}
          </Box>
        }
        secondary={
          <Typography variant="body2" color="text.secondary">
            {prizeTypeLabel(prize.prize_type)} • {formatCurrency(prize.value)} × {prize.quantity}
          </Typography>
        }
      />
    </ListItem>
  );
}

export default function PrizeManager({ event, prizes, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, prize: null });
  const [sortedPrizes, setSortedPrizes] = useState([]);
  const [isSorting, setIsSorting] = useState(false);

  // Sync sortedPrizes with prizes prop
  React.useEffect(() => {
    if (prizes) {
      setSortedPrizes([...prizes].sort((a, b) => a.position - b.position));
    }
  }, [prizes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (e) => {
    const { active, over } = e;

    if (active.id !== over?.id) {
      const oldIndex = sortedPrizes.findIndex(p => p.id === active.id);
      const newIndex = sortedPrizes.findIndex(p => p.id === over.id);

      const newOrder = arrayMove(sortedPrizes, oldIndex, newIndex);
      setSortedPrizes(newOrder);

      // Update positions on server
      setIsSorting(true);
      try {
        const updates = newOrder.map((prize, idx) => ({
          id: prize.id,
          position: idx + 1,
        }));

        await adminApi.reorderPrizes(event.id, updates);
        onUpdate?.();
      } catch (err) {
        console.error('Failed to reorder prizes:', err);
        // Revert on error
        setSortedPrizes([...prizes].sort((a, b) => a.position - b.position));
      } finally {
        setIsSorting(false);
      }
    }
  };

  const handleDeleteClick = (prize) => {
    setDeleteDialog({ open: true, prize });
  };

  const handleDeleteConfirm = async () => {
    const prizeId = deleteDialog.prize?.id;
    setDeleteDialog({ open: false, prize: null });

    try {
      await adminApi.deletePrize(event.id, prizeId);
      onUpdate?.();
    } catch (err) {
      alert(err.response?.data?.error || '刪除獎項失敗');
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingPrize(null);
    onUpdate?.();
  };

  const prizeTypeLabel = (type) => type === 'cash' ? '現金' : '禮品';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const isDraft = event.status === 'draft';

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2">
            獎項 ({prizes?.length || 0})
          </Typography>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setShowForm(true)}
            disabled={event.status !== 'draft'}
          >
            新增獎項
          </Button>
        </Box>

        <Collapse in={showForm || !!editingPrize}>
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                {editingPrize ? '編輯獎項' : '新增獎項'}
              </Typography>
              <PrizeForm
                eventId={event.id}
                prize={editingPrize}
                nextPosition={(prizes?.length || 0) + 1}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditingPrize(null); }}
              />
            </CardContent>
          </Card>
        </Collapse>

        {(!prizes || prizes.length === 0) && !showForm ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TrophyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              尚無獎項。新增一個開始吧！
            </Typography>
          </Box>
        ) : (
          <>
            {isDraft && sortedPrizes.length > 1 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                拖曳調整順序，由上到下依序抽獎
              </Alert>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedPrizes.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <List disablePadding>
                  {sortedPrizes.map((prize, index) => (
                    <SortablePrizeItem
                      key={prize.id}
                      prize={prize}
                      index={index}
                      onEdit={setEditingPrize}
                      onDelete={handleDeleteClick}
                      isDraft={isDraft}
                      formatCurrency={formatCurrency}
                      prizeTypeLabel={prizeTypeLabel}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          </>
        )}
      </CardContent>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, prize: null })}
      >
        <DialogTitle>刪除獎項</DialogTitle>
        <DialogContent>
          <DialogContentText>
            確定要刪除「{deleteDialog.prize?.name}」嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, prize: null })}>
            取消
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
