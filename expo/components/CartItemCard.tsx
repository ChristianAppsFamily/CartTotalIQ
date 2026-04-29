import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Trash2, Pencil } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CartItem } from '@/types/cart';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;

interface CartItemCardProps {
  item: CartItem;
  index: number;
  taxRate: number;
  onRemove: (id: string) => void;
  onEdit?: (id: string, updates: Partial<CartItem>) => void;
}

export default function CartItemCard({ item, index, taxRate, onRemove, onEdit }: CartItemCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemTax = item.price * taxRate;
  const itemTotal = item.price + itemTax;
  const isEven = index % 2 === 0;
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.price.toFixed(2));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            onRemove(item.id);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              onRemove(item.id);
            });
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setEditName(item.name);
    setEditPrice(item.price.toFixed(2));
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    const priceVal = parseFloat(editPrice);
    if (!editName.trim()) {
      Alert.alert('Name Required', 'Please enter an item name.');
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }

    onEdit?.(item.id, {
      name: editName.trim(),
      price: priceVal,
    });
    setEditModalVisible(false);
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.deleteBackground}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID={`delete-item-${item.id}`}
          >
            <Trash2 size={20} color="#FFF" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[styles.card, { transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.emojiContainer, { backgroundColor: isEven ? Colors.iconBgPurple : Colors.iconBgPink }]}>
            <Text style={styles.emoji}>{item.emoji || '🛒'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
          <View style={styles.prices}>
            <Text style={styles.totalPrice}>${itemTotal.toFixed(2)}</Text>
            <Text style={styles.basePrice}>${item.price.toFixed(2)} + tax</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              testID={`edit-item-${item.id}`}
            >
              <Pencil size={16} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={handleDelete}
              testID={`delete-icon-${item.id}`}
            >
              <Trash2 size={16} color={Colors.accentHot} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Item Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Item name"
                placeholderTextColor={Colors.muted}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Price</Text>
              <View style={styles.modalPriceRow}>
                <Text style={styles.modalDollar}>$</Text>
                <TextInput
                  style={styles.modalPriceInput}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="0.00"
                  placeholderTextColor={Colors.muted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: Colors.accentHot,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 20,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500' as const,
  },
  prices: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  basePrice: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.iconBgPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  modalDollar: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginRight: 4,
  },
  modalPriceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
