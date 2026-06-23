import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, TextInput, View } from "react-native";
import { router, type Href } from "expo-router";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react-native";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { GroupHistoryFilterSheet } from "@/components/groups/group-history-filter-sheet";
import { useGroup } from "@/lib/api/groups";
import { useGroupHistory } from "@/lib/api/questions";
import { QuestionType, type HistoryQuestionDTO } from "@/lib/api/types/question";
import { useGroupId } from "@/lib/group-id";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.Users]: "Members",
  [QuestionType.Custom]: "Custom",
  [QuestionType.Image]: "Image",
  [QuestionType.Text]: "Text",
  [QuestionType.Rating]: "Rating",
};

const TYPE_OPTIONS = Object.values(QuestionType).map((value) => ({
  value,
  label: QUESTION_TYPE_LABELS[value],
}));

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatUsedAt(usedAt?: string): string | null {
  if (!usedAt) return null;
  const date = new Date(usedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function GroupHistoryScreen() {
  const groupId = useGroupId();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim());
  const [questionType, setQuestionType] = useState<string[]>([]);
  const [submittedBy, setSubmittedBy] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: group } = useGroup(groupId);
  const memberOptions = useMemo(
    () => (group?.members ?? []).map((m) => ({ value: m.user, label: m.name })),
    [group?.members]
  );

  const {
    data,
    error,
    isError,
    isPending,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGroupHistory(groupId, { search: search || undefined, questionType, submittedBy });

  const items = data?.pages.flatMap((page) => page.questions) ?? [];
  const activeFilterCount = questionType.length + submittedBy.length;
  const hasFiltersOrSearch = activeFilterCount > 0 || search.length > 0;

  const resetAll = () => {
    setSearchInput("");
    setQuestionType([]);
    setSubmittedBy([]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Toolbar is pinned above the list (not a ListHeaderComponent) so the
          search TextInput keeps focus across list re-renders. */}
      <View className="gap-2 px-4 pb-2 pt-3">
        <View className="flex-row items-center gap-2 rounded-md border border-border bg-background px-3">
          <Icon as={Search} className="size-4 text-muted-foreground" />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search questions..."
            placeholderTextColor="#9ca3af"
            className="h-10 flex-1 text-base text-foreground"
            returnKeyType="search"
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={() => setSearchInput("")} hitSlop={8}>
              <Icon as={X} className="size-4 text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => setSheetOpen(true)}
            className="flex-row items-center gap-2 rounded-md border border-border px-3 py-2 active:opacity-60"
          >
            <Icon as={SlidersHorizontal} className="size-4 text-foreground" />
            <Text className="text-sm font-medium">
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
            </Text>
          </Pressable>

          {hasFiltersOrSearch ? (
            <Pressable onPress={resetAll} hitSlop={8} className="active:opacity-60">
              <Text variant="muted">Reset</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isPending ? (
        <HistorySkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load history"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasFiltersOrSearch ? "No matching questions" : "No history yet"}
          description={
            hasFiltersOrSearch
              ? "Try a different search or clear your filters."
              : "Answered questions will show up here."
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <HistoryRow item={item} onPress={() => openResults(groupId, item)} />}
          ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          contentContainerClassName="px-4 pb-24"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <Skeleton className="h-10 w-full rounded-md" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} />
          }
        />
      )}

      <GroupHistoryFilterSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        typeOptions={TYPE_OPTIONS}
        memberOptions={memberOptions}
        selectedTypes={questionType}
        selectedMembers={submittedBy}
        onApply={({ questionType: nextTypes, submittedBy: nextMembers }) => {
          setQuestionType(nextTypes);
          setSubmittedBy(nextMembers);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

function openResults(groupId: string, question: HistoryQuestionDTO) {
  router.push(`/groups/${groupId}/question/${question._id}/resultsdetailed` as Href);
}

function HistoryRow({ item, onPress }: { item: HistoryQuestionDTO; onPress: () => void }) {
  const usedAtLabel = formatUsedAt(item.usedAt);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-3 py-3 active:opacity-60"
    >
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="text-base text-foreground">
          {item.question}
        </Text>
        {usedAtLabel ? <Text className="text-xs text-muted-foreground">{usedAtLabel}</Text> : null}
      </View>
      <Icon as={ChevronRight} className="size-4 text-muted-foreground" />
    </Pressable>
  );
}

function HistorySkeleton() {
  return (
    <View className="gap-3 px-4 pt-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} className="gap-2 py-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </View>
      ))}
    </View>
  );
}
