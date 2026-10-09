import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/hooks';
import { request, ApiError } from '../api';
import { colors, darkColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { hapticSuccess, hapticError } from '../hooks/useHaptics';
import ScreenHeader from '../components/ScreenHeader';

type TripItem = {
  id: string;
  title: string;
  dayDate: string;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  status: 'PLANNED' | 'DONE' | 'SKIPPED';
};

type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string | null;
  items: TripItem[];
  hotel?: { name: string } | null;
};

export default function TripsScreen() {
  const token = useAppSelector((state) => state.auth.session?.accessToken);
  const { colorScheme } = useTheme();
  const dark = colorScheme === 'dark';
  const c = dark ? darkColors : colors;
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submittingTrip, setSubmittingTrip] = useState(false);

  // Add Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState('');
  const [itemDate, setItemDate] = useState('');
  const [itemTime, setItemTime] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);

  // AI Builder Modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTripId, setAiTripId] = useState<string | null>(null);
  const [aiDate, setAiDate] = useState('');
  const [aiInterests, setAiInterests] = useState('Culture, Coffee, History, Dining');
  const [aiPace, setAiPace] = useState<'RELAXED' | 'MODERATE' | 'PACKED'>('MODERATE');
  const [buildingAi, setBuildingAi] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await request<{ data: Trip[] }>('/trips', { token });
      setTrips(response.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load trips.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreateTrip = async () => {
    if (!newTitle.trim() || !newStartDate.trim() || !newEndDate.trim()) {
      Alert.alert('Required Fields', 'Please provide a trip title, start date (YYYY-MM-DD), and end date (YYYY-MM-DD).');
      return;
    }

    setSubmittingTrip(true);
    try {
      await request('/trips', {
        method: 'POST',
        token,
        body: {
          title: newTitle.trim(),
          startDate: newStartDate.trim(),
          endDate: newEndDate.trim(),
          description: newDescription.trim() || undefined,
        },
      });
      hapticSuccess();
      setCreateModalOpen(false);
      setNewTitle('');
      setNewStartDate('');
      setNewEndDate('');
      setNewDescription('');
      await load();
    } catch (err) {
      hapticError();
      Alert.alert('Creation Failed', err instanceof ApiError ? err.message : 'Could not create trip.');
    } finally {
      setSubmittingTrip(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedTripId || !itemTitle.trim() || !itemDate.trim()) {
      Alert.alert('Required Fields', 'Please provide an activity title and date (YYYY-MM-DD).');
      return;
    }

    setSubmittingItem(true);
    try {
      await request(`/trips/${selectedTripId}/items`, {
        method: 'POST',
        token,
        body: {
          title: itemTitle.trim(),
          dayDate: itemDate.trim(),
          startTime: itemTime.trim() || undefined,
          notes: itemNotes.trim() || undefined,
          itemType: 'ACTIVITY',
        },
      });
      hapticSuccess();
      setItemModalOpen(false);
      setItemTitle('');
      setItemDate('');
      setItemTime('');
      setItemNotes('');
      await load();
    } catch (err) {
      hapticError();
      Alert.alert('Add Failed', err instanceof ApiError ? err.message : 'Could not add activity.');
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleToggleItemStatus = async (tripId: string, item: TripItem) => {
    const nextStatus = item.status === 'DONE' ? 'PLANNED' : 'DONE';
    try {
      await request(`/trips/${tripId}/items/${item.id}`, {
        method: 'PATCH',
        token,
        body: { status: nextStatus },
      });
      hapticSuccess();
      setTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? {
                ...t,
                items: t.items.map((it) => (it.id === item.id ? { ...it, status: nextStatus } : it)),
              }
            : t,
        ),
      );
    } catch (err) {
      hapticError();
      Alert.alert('Update Failed', err instanceof ApiError ? err.message : 'Could not update item.');
    }
  };

  const handleDeleteItem = (tripId: string, itemId: string) => {
    Alert.alert('Remove Activity', 'Are you sure you want to remove this activity from your itinerary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await request(`/trips/${tripId}/items/${itemId}`, { method: 'DELETE', token });
            hapticSuccess();
            setTrips((prev) =>
              prev.map((t) => (t.id === tripId ? { ...t, items: t.items.filter((it) => it.id !== itemId) } : t)),
            );
          } catch (err) {
            hapticError();
            Alert.alert('Delete Failed', err instanceof ApiError ? err.message : 'Could not delete item.');
          }
        },
      },
    ]);
  };

  const handleDeleteTrip = (tripId: string, title: string) => {
    Alert.alert('Delete Trip', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await request(`/trips/${tripId}`, { method: 'DELETE', token });
            hapticSuccess();
            setTrips((prev) => prev.filter((t) => t.id !== tripId));
          } catch (err) {
            hapticError();
            Alert.alert('Delete Failed', err instanceof ApiError ? err.message : 'Could not delete trip.');
          }
        },
      },
    ]);
  };

  const handleBuildAiDay = async () => {
    if (!aiTripId || !aiDate.trim()) {
      Alert.alert('Required Date', 'Please specify the date (YYYY-MM-DD) for AI itinerary generation.');
      return;
    }

    setBuildingAi(true);
    try {
      await request(`/trips/${aiTripId}/build-day`, {
        method: 'POST',
        token,
        body: {
          dayDate: aiDate.trim(),
          interests: aiInterests.split(',').map((s) => s.trim()).filter(Boolean),
          pace: aiPace,
        },
      });
      hapticSuccess();
      setAiModalOpen(false);
      await load();
      Alert.alert('AI Plan Generated', 'Your day itinerary has been generated and added to your trip.');
    } catch (err) {
      hapticError();
      Alert.alert('Generation Failed', err instanceof ApiError ? err.message : 'Could not build AI day plan.');
    } finally {
      setBuildingAi(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.paper }]}>
      <ScreenHeader title="My trips" subtitle="Private itinerary planner" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        {/* Intro Banner */}
        <View style={[styles.intro, { backgroundColor: c.teal }]}>
          <Ionicons name="calendar-outline" size={24} color={c.gold} />
          <Text style={styles.introTitle}>Plan your stay</Text>
          <Text style={styles.introBody}>
            Combine reservations, verified local spots, and customized activities into a unified timeline.
          </Text>
          <Pressable
            onPress={() => {
              const today = new Date().toISOString().slice(0, 10);
              const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              setNewStartDate(today);
              setNewEndDate(nextWeek);
              setCreateModalOpen(true);
            }}
            style={[styles.createBtn, { backgroundColor: c.gold }]}
          >
            <Ionicons name="add" size={18} color={c.ink} />
            <Text style={[styles.createBtnText, { color: c.ink }]}>Create New Trip</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator color={c.teal} style={styles.loader} />}
        {error && <Text style={[styles.error, { color: c.danger }]}>{error}</Text>}

        {!loading && !error && trips.length === 0 && (
          <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Ionicons name="map-outline" size={42} color={c.inkMuted} />
            <Text style={[styles.emptyTitle, { color: c.ink }]}>No trips yet</Text>
            <Text style={[styles.emptyBody, { color: c.inkMuted }]}>
              Create your first itinerary to organize places to visit, reservations, and activities.
            </Text>
          </View>
        )}

        {trips.map((trip) => (
          <View key={trip.id} style={[styles.tripCard, { backgroundColor: c.surface, borderColor: c.line }]}>
            <View style={styles.tripHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tripTitle, { color: c.ink }]}>{trip.title}</Text>
                <Text style={[styles.tripDates, { color: c.inkMuted }]}>
                  {trip.startDate.slice(0, 10)} — {trip.endDate.slice(0, 10)}
                </Text>
                {trip.hotel && <Text style={[styles.tripHotel, { color: c.teal }]}>🏨 {trip.hotel.name}</Text>}
              </View>

              <View style={styles.tripActions}>
                <Pressable
                  onPress={() => handleDeleteTrip(trip.id, trip.title)}
                  hitSlop={8}
                  style={[styles.iconBtn, { backgroundColor: c.paperDeep }]}
                >
                  <Ionicons name="trash-outline" size={16} color={c.danger} />
                </Pressable>
              </View>
            </View>

            {trip.description ? (
              <Text style={[styles.tripDesc, { color: c.inkMuted }]}>{trip.description}</Text>
            ) : null}

            {/* Activities List */}
            {trip.items.length > 0 ? (
              <View style={styles.itemsList}>
                {trip.items.map((item) => (
                  <View key={item.id} style={[styles.itemRow, { borderTopColor: c.line }]}>
                    <Pressable
                      onPress={() => void handleToggleItemStatus(trip.id, item)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={item.status === 'DONE' ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={item.status === 'DONE' ? c.teal : c.inkMuted}
                      />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.itemTitle,
                          {
                            color: item.status === 'DONE' ? c.inkMuted : c.ink,
                            textDecorationLine: item.status === 'DONE' ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.itemMeta, { color: c.inkMuted }]}>
                        {item.dayDate.slice(0, 10)}
                        {item.startTime ? ` · ${item.startTime}` : ''}
                      </Text>
                      {item.notes ? (
                        <Text style={[styles.itemNotes, { color: c.inkMuted }]}>{item.notes}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleDeleteItem(trip.id, item.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="close" size={18} color={c.inkMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noItemsText, { color: c.inkMuted }]}>No activities added yet.</Text>
            )}

            {/* Trip Bottom Controls */}
            <View style={[styles.cardButtons, { borderTopColor: c.line }]}>
              <Pressable
                onPress={() => {
                  setSelectedTripId(trip.id);
                  setItemDate(trip.startDate.slice(0, 10));
                  setItemModalOpen(true);
                }}
                style={[styles.actionBtn, { backgroundColor: c.paperDeep }]}
              >
                <Ionicons name="add-circle-outline" size={16} color={c.teal} />
                <Text style={[styles.actionBtnText, { color: c.teal }]}>Add Activity</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setAiTripId(trip.id);
                  setAiDate(trip.startDate.slice(0, 10));
                  setAiModalOpen(true);
                }}
                style={[styles.actionBtn, { backgroundColor: c.paperDeep }]}
              >
                <Ionicons name="sparkles-outline" size={16} color={c.gold} />
                <Text style={[styles.actionBtnText, { color: c.ink }]}>AI Day Plan</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {!loading && (
          <Pressable
            onPress={() => void load()}
            style={[styles.refresh, { borderColor: c.line }]}
          >
            <Ionicons name="refresh-outline" size={16} color={c.teal} />
            <Text style={[styles.refreshText, { color: c.teal }]}>Refresh itinerary</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* CREATE TRIP MODAL */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.ink }]}>Create New Trip</Text>

            <TextInput
              style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Trip Title (e.g., Addis Exploration)"
              placeholderTextColor={c.inkMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1, color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
                placeholder="Start (YYYY-MM-DD)"
                placeholderTextColor={c.inkMuted}
                value={newStartDate}
                onChangeText={setNewStartDate}
              />
              <TextInput
                style={[styles.input, { flex: 1, color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
                placeholder="End (YYYY-MM-DD)"
                placeholderTextColor={c.inkMuted}
                value={newEndDate}
                onChangeText={setNewEndDate}
              />
            </View>

            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top', color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Trip Notes / Description (Optional)"
              placeholderTextColor={c.inkMuted}
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setCreateModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: c.paperDeep }]}
              >
                <Text style={{ color: c.ink, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateTrip}
                disabled={submittingTrip}
                style={[styles.modalBtn, { backgroundColor: c.teal }]}
              >
                {submittingTrip ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Create Trip</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD ACTIVITY MODAL */}
      <Modal visible={itemModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.ink }]}>Add Activity</Text>

            <TextInput
              style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Activity Title (e.g., Dinner at Cultural Restaurant)"
              placeholderTextColor={c.inkMuted}
              value={itemTitle}
              onChangeText={setItemTitle}
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, { flex: 1, color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
                placeholder="Date (YYYY-MM-DD)"
                placeholderTextColor={c.inkMuted}
                value={itemDate}
                onChangeText={setItemDate}
              />
              <TextInput
                style={[styles.input, { flex: 1, color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
                placeholder="Time (e.g., 14:00)"
                placeholderTextColor={c.inkMuted}
                value={itemTime}
                onChangeText={setItemTime}
              />
            </View>

            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top', color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Notes (Optional)"
              placeholderTextColor={c.inkMuted}
              value={itemNotes}
              onChangeText={setItemNotes}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setItemModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: c.paperDeep }]}
              >
                <Text style={{ color: c.ink, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                disabled={submittingItem}
                style={[styles.modalBtn, { backgroundColor: c.teal }]}
              >
                {submittingItem ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Add Activity</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI DAY BUILDER MODAL */}
      <Modal visible={aiModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="sparkles" size={22} color={c.gold} />
              <Text style={[styles.modalTitle, { color: c.ink, marginBottom: 0 }]}>AI Day Builder</Text>
            </View>
            <Text style={{ fontSize: 13, color: c.inkMuted, marginBottom: 12 }}>
              Generate an intelligent itinerary for a specific day with curated places and timing.
            </Text>

            <TextInput
              style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Target Date (YYYY-MM-DD)"
              placeholderTextColor={c.inkMuted}
              value={aiDate}
              onChangeText={setAiDate}
            />

            <TextInput
              style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.paper }]}
              placeholder="Interests (comma separated: Coffee, Museum, Food)"
              placeholderTextColor={c.inkMuted}
              value={aiInterests}
              onChangeText={setAiInterests}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {(['RELAXED', 'MODERATE', 'PACKED'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setAiPace(p)}
                  style={[
                    styles.paceBtn,
                    {
                      backgroundColor: aiPace === p ? c.teal : c.paper,
                      borderColor: aiPace === p ? c.teal : c.line,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: aiPace === p ? '#FFF' : c.ink }}>
                    {p}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setAiModalOpen(false)}
                style={[styles.modalBtn, { backgroundColor: c.paperDeep }]}
              >
                <Text style={{ color: c.ink, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleBuildAiDay}
                disabled={buildingAi}
                style={[styles.modalBtn, { backgroundColor: c.teal }]}
              >
                {buildingAi ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Generate Plan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 14 },
  intro: { borderRadius: 20, padding: 18 },
  introTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 10 },
  introBody: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 18, marginTop: 5 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  createBtnText: { fontSize: 13, fontWeight: '800' },
  loader: { marginTop: 32 },
  error: { textAlign: 'center', fontSize: 13, padding: 16 },
  empty: { alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 10 },
  emptyBody: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 5 },
  tripCard: { borderRadius: 20, borderWidth: 1, padding: 16 },
  tripHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tripTitle: { fontSize: 18, fontWeight: '800' },
  tripDates: { fontSize: 12, marginTop: 4 },
  tripHotel: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  tripDesc: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  tripActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  itemsList: { marginTop: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemMeta: { fontSize: 11, marginTop: 2 },
  itemNotes: { fontSize: 11, marginTop: 3, fontStyle: 'italic' },
  noItemsText: { fontSize: 12, marginVertical: 12, fontStyle: 'italic' },
  cardButtons: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  refresh: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  refreshText: { fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
  },
  rowInputs: { flexDirection: 'row', gap: 10 },
  paceBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
