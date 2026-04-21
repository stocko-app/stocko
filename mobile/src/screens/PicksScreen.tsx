import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../lib/api";
import { useAuth } from "../store/auth-context";
import { stockoTheme } from "../theme/stocko";

type Pick = {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  isCaptainDraft: boolean;
  captainActivatedDay: string | null;
  weekPoints: number;
  isAuto: boolean;
  latestPrice: { close: number; pctChange: number } | null;
};

type WeekData = {
  gameWeekId: string;
  weekStart: string;
  weekEnd: string;
  deadline: string;
  status: string;
  deadlinePassed: boolean;
  picks: Pick[];
  nextWeekDraft: {
    gameWeekId: string;
    weekStart: string;
    weekEnd: string;
    deadline: string;
    picks: Array<{
      id: string;
      ticker: string;
      name: string;
      sector: string;
      isCaptainDraft: boolean;
      isAuto?: boolean;
    }>;
  } | null;
};

type AvailableStock = {
  id: string;
  ticker: string;
  name: string;
  market?: string;
  sector: string;
  latestPrice: { close: number; pctChange: number } | null;
};

type SelectedPick = {
  ticker: string;
  isCaptainDraft: boolean;
};

export function PicksScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [week, setWeek] = useState<WeekData | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availableStocks, setAvailableStocks] = useState<AvailableStock[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<SelectedPick[]>([]);
  const [search, setSearch] = useState("");
  const [pickerMode, setPickerMode] = useState<"current" | "next">("current");

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<WeekData>("/api/picks/week");
      setWeek(response);
    } catch (e) {
      setWeek(null);
      setError((e as Error).message || "Erro ao carregar picks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek, token]);

  const loadAvailableStocks = useCallback(async () => {
    setAvailableLoading(true);
    setPickerError("");
    try {
      // Compatibilidade futura: tenta endpoint dedicado de picks disponíveis.
      const fromAvailable = await api.get<AvailableStock[]>("/api/picks/available");
      setAvailableStocks(fromAvailable);
    } catch {
      try {
        // Backend atual expõe disponíveis em /api/stocks.
        const fromStocks = await api.get<AvailableStock[]>("/api/stocks");
        setAvailableStocks(fromStocks);
      } catch (e) {
        setPickerError((e as Error).message || "Erro ao carregar ações disponíveis.");
      }
    } finally {
      setAvailableLoading(false);
    }
  }, []);

  const openPicker = async (mode: "current" | "next") => {
    const sourcePicks =
      mode === "next" ? (week?.nextWeekDraft?.picks ?? []) : (week?.picks ?? []);
    const initial = sourcePicks.map((pick) => ({
      ticker: pick.ticker,
      isCaptainDraft: pick.isCaptainDraft,
    }));
    setPickerMode(mode);
    setSelected(initial);
    setSearch("");
    setPickerVisible(true);
    await loadAvailableStocks();
  };

  const isSelected = (ticker: string) => selected.some((pick) => pick.ticker === ticker);

  const toggleStock = (ticker: string) => {
    if (isSelected(ticker)) {
      setSelected((prev) => prev.filter((pick) => pick.ticker !== ticker));
      return;
    }
    if (selected.length >= 5) return;
    setSelected((prev) => [...prev, { ticker, isCaptainDraft: false }]);
  };

  const toggleCaptain = (ticker: string) => {
    setSelected((prev) =>
      prev.map((pick) => ({
        ...pick,
        isCaptainDraft: pick.ticker === ticker ? !pick.isCaptainDraft : false,
      }))
    );
  };

  const submitPicks = async () => {
    if (selected.length !== 5) return;
    setSubmitting(true);
    setPickerError("");
    try {
      await api.post("/api/picks", { picks: selected });
      setPickerVisible(false);
      await loadWeek();
    } catch (e) {
      setPickerError((e as Error).message || "Erro ao submeter picks.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPoints = useMemo(
    () => week?.picks.reduce((sum, pick) => sum + pick.weekPoints, 0) ?? 0,
    [week]
  );
  const filteredStocks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableStocks;
    return availableStocks.filter(
      (stock) => stock.ticker.toLowerCase().includes(term) || stock.name.toLowerCase().includes(term)
    );
  }, [availableStocks, search]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator color={stockoTheme.colors.gold400} />
        <Text style={styles.helperText}>A carregar picks...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Não foi possível carregar.</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadWeek()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Picks</Text>
        <Text style={styles.subtitle}>
          Semana{" "}
          {week
            ? `${new Date(week.weekStart).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })} - ${new Date(week.weekEnd).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}`
            : "--"}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Pontos:</Text>
          <Text style={styles.statsValue}>{totalPoints.toFixed(1)}</Text>
          <Text style={styles.statsLabel}>Picks:</Text>
          <Text style={styles.statsValue}>{week?.picks.length ?? 0}/5</Text>
        </View>
        {!week?.deadlinePassed ? (
          <Pressable style={styles.chooseButton} onPress={() => void openPicker("current")}>
            <Text style={styles.chooseButtonText}>
              {(week?.picks.length ?? 0) === 0 ? "Escolher picks" : "Alterar picks"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.deadlineLockedBadge}>
            <Text style={styles.deadlineLockedText}>Deadline fechado: picks desta semana bloqueados.</Text>
          </View>
        )}
      </View>

      {!week?.picks.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ainda sem picks</Text>
          <Text style={styles.emptyText}>
            {week?.deadlinePassed
              ? "O deadline desta semana já passou. Podes preparar a próxima semana em breve."
              : "Ainda não escolheste os teus 5 picks para esta semana."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={week.picks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const positive = (item.latestPrice?.pctChange ?? 0) >= 0;
            return (
              <View style={styles.pickCard}>
                <View style={styles.tickerBadge}>
                  <Text style={styles.tickerText}>{item.ticker}</Text>
                </View>

                <View style={styles.pickInfo}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.pickName}>
                      {item.name}
                    </Text>
                    {item.isCaptainDraft ? <Text style={styles.flag}>★</Text> : null}
                    {item.isAuto ? <Text style={styles.autoFlag}>AUTO</Text> : null}
                  </View>
                  <Text style={styles.pickSector}>{item.sector}</Text>
                </View>

                <View style={styles.changeWrap}>
                  <Text style={[styles.changeText, positive ? styles.changeUp : styles.changeDown]}>
                    {item.latestPrice ? `${positive ? "+" : "-"}${Math.abs(item.latestPrice.pctChange).toFixed(2)}%` : "--"}
                  </Text>
                  <Text style={styles.pointsText}>{item.weekPoints.toFixed(1)} pts</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {week?.nextWeekDraft ? (
        <View style={styles.nextWeekCard}>
          <Text style={styles.nextWeekTitle}>Próxima semana</Text>
          <Text style={styles.nextWeekSubtitle}>
            {`${new Date(week.nextWeekDraft.weekStart).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
            })} - ${new Date(week.nextWeekDraft.weekEnd).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "short",
            })}`}
          </Text>
          <Pressable style={styles.chooseButton} onPress={() => void openPicker("next")}>
            <Text style={styles.chooseButtonText}>
              {week.nextWeekDraft.picks.length === 0 ? "Preparar picks" : "Alterar picks da próxima semana"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pickerMode === "next" ? "Preparar próxima semana" : "Escolher picks"}
            </Text>
            <Pressable onPress={() => setPickerVisible(false)}>
              <Text style={styles.closeText}>Fechar</Text>
            </Pressable>
          </View>

          <Text style={styles.modalHint}>Seleciona exatamente 5 ações e marca uma como capitão (★).</Text>
          <Text style={styles.modalCounter}>{selected.length}/5 selecionados</Text>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar ticker ou nome..."
            placeholderTextColor={stockoTheme.colors.slate500}
          />

          {selected.length > 0 ? (
            <View style={styles.selectedWrap}>
              {selected.map((pick) => (
                <Pressable
                  key={pick.ticker}
                  style={[styles.selectedChip, pick.isCaptainDraft ? styles.selectedChipCaptain : undefined]}
                  onPress={() => toggleCaptain(pick.ticker)}
                >
                  <Text style={styles.selectedChipText}>{pick.ticker}</Text>
                  <Text style={[styles.starText, pick.isCaptainDraft ? styles.starOn : undefined]}>★</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {availableLoading ? (
            <View style={styles.centerInline}>
              <ActivityIndicator color={stockoTheme.colors.gold400} />
            </View>
          ) : (
            <FlatList
              data={filteredStocks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.availableList}
              renderItem={({ item }) => {
                const selectedStock = isSelected(item.ticker);
                const disabled = !selectedStock && selected.length >= 5;
                const positive = (item.latestPrice?.pctChange ?? 0) >= 0;
                return (
                  <Pressable
                    style={[styles.availableRow, selectedStock ? styles.availableRowSelected : undefined, disabled ? styles.availableRowDisabled : undefined]}
                    disabled={disabled}
                    onPress={() => toggleStock(item.ticker)}
                  >
                    <View style={styles.availableMain}>
                      <Text style={styles.availableTicker}>{item.ticker}</Text>
                      <Text numberOfLines={1} style={styles.availableName}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={styles.availableSector}>{item.sector}</Text>
                    <Text style={[styles.availablePct, positive ? styles.changeUp : styles.changeDown]}>
                      {item.latestPrice ? `${positive ? "+" : "-"}${Math.abs(item.latestPrice.pctChange).toFixed(2)}%` : "--"}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {pickerError ? <Text style={styles.modalError}>{pickerError}</Text> : null}

          <View style={styles.modalActions}>
            <Pressable style={styles.cancelButton} onPress={() => setPickerVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, (selected.length !== 5 || submitting) ? styles.submitButtonDisabled : undefined]}
              disabled={selected.length !== 5 || submitting}
              onPress={() => void submitPicks()}
            >
              {submitting ? (
                <ActivityIndicator color={stockoTheme.colors.navy950} />
              ) : (
                <Text style={styles.submitButtonText}>Confirmar picks</Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: stockoTheme.colors.navy950, padding: 16 },
  centerContainer: {
    flex: 1,
    backgroundColor: stockoTheme.colors.navy950,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  helperText: {
    color: stockoTheme.colors.slate400,
    fontSize: 14,
  },
  headerCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 180, 41, 0.14)",
    borderRadius: 16,
    backgroundColor: "rgba(13, 21, 48, 0.76)",
    padding: 16,
    gap: 8,
  },
  chooseButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: stockoTheme.colors.gold500,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chooseButtonText: {
    color: stockoTheme.colors.navy950,
    fontWeight: "800",
    fontSize: 13,
  },
  deadlineLockedBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(148,163,184,0.12)",
    borderColor: "rgba(148,163,184,0.28)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deadlineLockedText: {
    color: stockoTheme.colors.slate400,
    fontSize: 12,
    fontWeight: "600",
  },
  title: { fontSize: 24, fontWeight: "800", color: stockoTheme.colors.slate100 },
  subtitle: { color: stockoTheme.colors.slate300, fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statsLabel: {
    color: stockoTheme.colors.slate500,
    fontSize: 12,
  },
  statsValue: {
    color: stockoTheme.colors.gold400,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 8,
  },
  errorCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(127, 29, 29, 0.16)",
    padding: 16,
    gap: 10,
  },
  errorTitle: {
    color: stockoTheme.colors.slate100,
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: {
    color: stockoTheme.colors.slate300,
    fontSize: 13,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: stockoTheme.colors.gold500,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  retryText: {
    color: stockoTheme.colors.navy950,
    fontWeight: "800",
  },
  emptyCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(13, 21, 48, 0.5)",
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    color: stockoTheme.colors.slate100,
    fontWeight: "700",
    fontSize: 18,
  },
  emptyText: {
    color: stockoTheme.colors.slate400,
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 28,
    gap: 10,
  },
  pickCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(13, 21, 48, 0.65)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tickerBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: stockoTheme.colors.navy700,
    alignItems: "center",
    justifyContent: "center",
  },
  tickerText: {
    color: stockoTheme.colors.gold400,
    fontWeight: "800",
    fontSize: 12,
  },
  pickInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pickName: {
    color: stockoTheme.colors.slate100,
    fontWeight: "700",
    fontSize: 14,
    flexShrink: 1,
  },
  flag: {
    color: stockoTheme.colors.gold400,
    fontSize: 12,
  },
  autoFlag: {
    color: stockoTheme.colors.slate400,
    fontSize: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
  },
  pickSector: {
    color: stockoTheme.colors.slate500,
    fontSize: 12,
    marginTop: 2,
  },
  changeWrap: {
    alignItems: "flex-end",
    minWidth: 70,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  changeUp: {
    color: stockoTheme.colors.success,
  },
  changeDown: {
    color: stockoTheme.colors.danger,
  },
  pointsText: {
    marginTop: 2,
    fontSize: 12,
    color: stockoTheme.colors.slate500,
  },
  nextWeekCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 180, 41, 0.18)",
    backgroundColor: "rgba(13, 21, 48, 0.56)",
    padding: 14,
    gap: 6,
  },
  nextWeekTitle: {
    color: stockoTheme.colors.slate100,
    fontSize: 16,
    fontWeight: "700",
  },
  nextWeekSubtitle: {
    color: stockoTheme.colors.slate400,
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: stockoTheme.colors.navy950,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: stockoTheme.colors.slate100,
    fontSize: 24,
    fontWeight: "800",
  },
  closeText: {
    color: stockoTheme.colors.gold400,
    fontWeight: "700",
  },
  modalHint: {
    marginTop: 8,
    color: stockoTheme.colors.slate400,
    fontSize: 13,
  },
  modalCounter: {
    marginTop: 6,
    color: stockoTheme.colors.gold400,
    fontSize: 12,
    fontWeight: "700",
  },
  searchInput: {
    marginTop: 10,
    backgroundColor: stockoTheme.colors.navy800,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: stockoTheme.colors.slate100,
  },
  selectedWrap: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: stockoTheme.colors.navy700,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectedChipCaptain: {
    borderColor: "rgba(240, 180, 41, 0.5)",
    backgroundColor: "rgba(240, 180, 41, 0.18)",
  },
  selectedChipText: {
    color: stockoTheme.colors.slate100,
    fontWeight: "700",
    fontSize: 12,
  },
  starText: {
    color: stockoTheme.colors.slate500,
    fontSize: 12,
  },
  starOn: {
    color: stockoTheme.colors.gold400,
  },
  centerInline: {
    paddingVertical: 20,
    alignItems: "center",
  },
  availableList: {
    marginTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  availableRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(13, 21, 48, 0.65)",
    padding: 10,
  },
  availableRowSelected: {
    borderColor: "rgba(240, 180, 41, 0.5)",
    backgroundColor: "rgba(240, 180, 41, 0.12)",
  },
  availableRowDisabled: {
    opacity: 0.45,
  },
  availableMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  availableTicker: {
    color: stockoTheme.colors.gold400,
    fontWeight: "800",
    fontSize: 12,
  },
  availableName: {
    flex: 1,
    color: stockoTheme.colors.slate100,
    fontSize: 13,
    fontWeight: "600",
  },
  availableSector: {
    marginTop: 2,
    color: stockoTheme.colors.slate500,
    fontSize: 11,
  },
  availablePct: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  modalError: {
    color: stockoTheme.colors.danger,
    marginTop: 8,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  cancelButtonText: {
    color: stockoTheme.colors.slate300,
    fontWeight: "700",
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: stockoTheme.colors.gold500,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: stockoTheme.colors.navy950,
    fontWeight: "800",
  },
});

