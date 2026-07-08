import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocalSearchParams } from "expo-router";
import { useGroupId } from "@/lib/group-id";
import { Pressable, useWindowDimensions, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check, Filter, X } from "lucide-react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorCard } from "@/components/ui/error-card";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Sheet, type SheetHandle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useGroup } from "@/lib/api/groups";
import type { GroupMemberDTO } from "@/lib/api/types/group";
import { useQuestion, useQuestionResults } from "@/lib/api/questions";
import { QuestionOptionsList } from "./question-options-list";
import {
  QuestionType,
  type PairingResultDTO,
  type QuestionResultDTO,
  type QuestionResultUserDTO,
} from "@/lib/api/types/question";
import { cn } from "@/lib/utils";
import { AspectImage } from "./aspect-image";

type SelectedMember = {
  userId: string;
  name: string;
  avatarUrl?: string;
};

type MemberFilterOption = SelectedMember & {
  voted: boolean;
};

type MemberFilterSheetHandle = { present: () => void };

const MEMBER_FILTER_SHEET_HEIGHT = 520;

export function QuestionResultsDetailScreen() {
  const groupId = useGroupId();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const memberFilterRef = useRef<MemberFilterSheetHandle>(null);
  const resultsQuery = useQuestionResults(groupId, questionId);
  const groupQuery = useGroup(groupId);
  // Supplementary (Tier 2): the full option set, so options nobody voted for —
  // which are absent from the aggregated results — are still visible here.
  const questionQuery = useQuestion(groupId, questionId);
  const { data } = resultsQuery;

  const isPairing = data?.questionType === QuestionType.Pairing;
  const results = useMemo(() => data?.results ?? [], [data?.results]);
  const pairingResults = useMemo(
    () => data?.pairingResults ?? [],
    [data?.pairingResults]
  );
  const groupMembers = useMemo(
    () => groupQuery.data?.members ?? [],
    [groupQuery.data?.members]
  );
  const isImage = data?.questionType === QuestionType.Image;
  const isEmpty = isPairing ? pairingResults.length === 0 : results.length === 0;
  const isPending = resultsQuery.isPending || groupQuery.isPending;
  const isError = resultsQuery.isError || groupQuery.isError;
  const error = resultsQuery.error ?? groupQuery.error;
  const isRefetching = resultsQuery.isRefetching || groupQuery.isRefetching;
  const refetch = () => {
    void Promise.all([resultsQuery.refetch(), groupQuery.refetch()]);
  };

  const selectedMember = useMemo(
    () =>
      selectedMemberId
        ? findSelectedMember(selectedMemberId, groupMembers, results, pairingResults)
        : null,
    [groupMembers, pairingResults, results, selectedMemberId]
  );
  const memberOptions = useMemo(
    () =>
      groupMembers.map((member) => ({
        userId: member.user,
        name: member.name,
        avatarUrl: member.avatarUrl,
        voted: hasMemberVote(member.user, results, pairingResults),
      })),
    [groupMembers, pairingResults, results]
  );

  const selectUser = (user: QuestionResultUserDTO) => setSelectedMemberId(user.userId);
  const selectMember = (userId: string | null) => {
    setSelectedMemberId(userId);
  };

  return (
    <Screen onRefresh={refetch} refreshing={isRefetching}>
      {isPending ? (
        <ResultsDetailSkeleton />
      ) : isError ? (
        <ErrorCard
          title="Could not load detailed results"
          error={error}
          onRetry={refetch}
          isRetrying={isRefetching}
        />
      ) : isEmpty ? (
        <EmptyState title="No results yet" />
      ) : (
        <View className="gap-3">
          <MemberFilterBar
            selectedMember={selectedMember}
            onClear={() => setSelectedMemberId(null)}
            onOpen={() => memberFilterRef.current?.present()}
          />

          {selectedMember ? (
            isPairing ? (
              <FocusedPairingResult member={selectedMember} results={pairingResults} />
            ) : (
              <FocusedResultList
                isImage={isImage}
                member={selectedMember}
                results={results}
              />
            )
          ) : isPairing ? (
            <View className="gap-3">
              {pairingResults.map((result) => (
                <PairingDetailCard
                  key={result.key}
                  result={result}
                  onSelectUser={selectUser}
                />
              ))}
            </View>
          ) : (
            <View className="gap-3">
              {results.map((result, index) => (
                <ResultDetailCard
                  key={`${result.option}-${index}`}
                  isImage={isImage}
                  result={result}
                  onSelectUser={selectUser}
                />
              ))}
            </View>
          )}

          {questionQuery.data ? (
            <QuestionOptionsList
              className="mt-3"
              options={questionQuery.data.options ?? []}
              questionType={questionQuery.data.questionType}
              title="All options"
            />
          ) : null}

          <MemberFilterSheet
            ref={memberFilterRef}
            members={memberOptions}
            selectedMemberId={selectedMemberId}
            onSelect={selectMember}
          />
        </View>
      )}
    </Screen>
  );
}

// One card per key; inside, each value the key was matched with, sorted by
// count, with the members who chose it.
function PairingDetailCard({
  result,
  onSelectUser,
}: {
  result: PairingResultDTO;
  onSelectUser: (user: QuestionResultUserDTO) => void;
}) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <Text className="w-full text-center text-lg font-black text-card-foreground">
        {result.key}
      </Text>

      {result.valueCounts.length === 0 ? (
        <Text className="text-center text-sm text-muted-foreground">
          No votes yet
        </Text>
      ) : (
        <View className="gap-2">
          {result.valueCounts.map((vc, index) => (
            <View
              key={`${vc.value}-${index}`}
              className="gap-2 rounded-lg bg-secondary p-3"
            >
              <View className="gap-1">
                <Text
                  selectable
                  className="w-full text-sm font-semibold text-secondary-foreground"
                >
                  {vc.value}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {vc.count} ({vc.percentage}%)
                </Text>
              </View>

              {vc.users.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {vc.users.map((user, uidx) => (
                    <ResultUserChip
                      key={`${user.userId}-${uidx}`}
                      user={user}
                      onPress={onSelectUser}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ResultDetailCard({
  isImage,
  onSelectUser,
  result,
}: {
  isImage: boolean;
  onSelectUser: (user: QuestionResultUserDTO) => void;
  result: QuestionResultDTO;
}) {
  const voteLabel = result.count === 1 ? "vote" : "votes";

  return (
    <View className="items-center justify-center gap-3 rounded-xl border border-border bg-card p-4">
      <View className="w-full items-center gap-1.5">
        {isImage ? (
          <AspectImage uri={result.option} className="rounded-lg" />
        ) : (
          <Text
            selectable
            className="w-full text-center text-lg font-black text-card-foreground"
          >
            {result.option}
          </Text>
        )}

        <Text className="text-center text-sm text-muted-foreground">
          {result.count} {voteLabel} ({result.percentage}%)
        </Text>
      </View>

      {result.users.length > 0 ? (
        <View className="w-full flex-row flex-wrap justify-center gap-2">
          {result.users.map((user, index) => (
            <ResultUserChip
              key={`${user.userId}-${index}`}
              user={user}
              onPress={onSelectUser}
            />
          ))}
        </View>
      ) : (
        <Text className="text-center text-sm text-muted-foreground">No votes</Text>
      )}
    </View>
  );
}

function FocusedResultList({
  isImage,
  member,
  results,
}: {
  isImage: boolean;
  member: SelectedMember;
  results: QuestionResultDTO[];
}) {
  const memberResults = results.filter((result) => resultHasUser(result, member.userId));

  if (memberResults.length === 0) {
    return <EmptyState title={`No vote from ${member.name}`} />;
  }

  return (
    <View className="gap-3">
      {memberResults.map((result, index) => (
        <FocusedResultCard
          key={`${result.option}-${index}`}
          isImage={isImage}
          result={result}
        />
      ))}
    </View>
  );
}

function FocusedResultCard({
  isImage,
  result,
}: {
  isImage: boolean;
  result: QuestionResultDTO;
}) {
  const voteLabel = result.count === 1 ? "vote" : "votes";

  return (
    <View className="items-center justify-center gap-3 rounded-xl border border-border bg-card p-4">
      {isImage ? (
        <AspectImage uri={result.option} className="rounded-lg" />
      ) : (
        <Text
          selectable
          className="w-full text-center text-lg font-black text-card-foreground"
        >
          {result.option}
        </Text>
      )}

      <Text className="text-center text-sm text-muted-foreground">
        {result.count} {voteLabel} ({result.percentage}%)
      </Text>
    </View>
  );
}

function FocusedPairingResult({
  member,
  results,
}: {
  member: SelectedMember;
  results: PairingResultDTO[];
}) {
  const hasVote = results.some((result) =>
    result.valueCounts.some((vc) => valueCountHasUser(vc, member.userId))
  );

  if (!hasVote) {
    return <EmptyState title={`No vote from ${member.name}`} />;
  }

  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <View className="items-center gap-2">
        <MemberAvatar member={member} sizeClassName="size-10" />
        <Text className="w-full text-center text-lg font-black text-card-foreground">
          {member.name}
          {"'s matchup"}
        </Text>
      </View>

      <View className="gap-2">
        {results.map((result) => {
          const selectedValue = result.valueCounts.find((vc) =>
            valueCountHasUser(vc, member.userId)
          );
          const voteLabel = selectedValue?.count === 1 ? "vote" : "votes";

          return (
            <View key={result.key} className="gap-1 rounded-lg bg-secondary p-3">
              <Text className="text-sm font-bold text-secondary-foreground">
                {result.key}
              </Text>
              {selectedValue ? (
                <>
                  <Text
                    selectable
                    className="w-full text-base font-semibold text-secondary-foreground"
                  >
                    {selectedValue.value}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {selectedValue.count} {voteLabel} ({selectedValue.percentage}%)
                  </Text>
                </>
              ) : (
                <Text className="text-sm text-muted-foreground">No match</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MemberFilterBar({
  selectedMember,
  onClear,
  onOpen,
}: {
  selectedMember: SelectedMember | null;
  onClear: () => void;
  onOpen: () => void;
}) {
  return (
      <Button variant="outline" className="flex-1 justify-between" onPress={onOpen}>
        <Icon as={Filter} className="size-4" />
        <Text numberOfLines={1} className="flex-1">
          {selectedMember ? selectedMember.name : "Filter by member"}
        </Text>
        {selectedMember ? (
          <Button variant="ghost" size="icon" onPress={onClear}>
            <Icon as={X} className="size-4" />
          </Button>
          )
          : null
        }
      </Button>
  );
}

const MemberFilterSheet = forwardRef<
  MemberFilterSheetHandle,
  {
  members: MemberFilterOption[];
  onSelect: (userId: string | null) => void;
  selectedMemberId: string | null;
  }
>(function MemberFilterSheet({ members, onSelect, selectedMemberId }, ref) {
  const modalRef = useRef<SheetHandle>(null);
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(MEMBER_FILTER_SHEET_HEIGHT, Math.round(height * 0.82));

  useImperativeHandle(ref, () => ({ present: () => modalRef.current?.present() }), []);

  const dismiss = () => modalRef.current?.dismiss();
  const select = (userId: string | null) => {
    onSelect(userId);
    dismiss();
  };

  return (
    <Sheet ref={modalRef} height={sheetHeight}>
      <Text variant="large">Filter by member</Text>

      <BottomSheetScrollView style={{ flex: 1 }}>
        <MemberFilterRow
          label="All votes"
          selected={selectedMemberId == null}
          status="Clear filter"
          onPress={() => select(null)}
        />

        {members.length === 0 ? (
          <Text variant="muted" className="mt-3">
            No members
          </Text>
        ) : (
          <View className="mt-3 gap-2">
            {members.map((member) => (
              <MemberFilterRow
                key={member.userId}
                avatarUrl={member.avatarUrl}
                label={member.name}
                selected={selectedMemberId === member.userId}
                status={member.voted ? "Voted" : "No vote"}
                onPress={() => select(member.userId)}
              />
            ))}
          </View>
        )}
      </BottomSheetScrollView>
    </Sheet>
  );
});

function MemberFilterRow({
  avatarUrl,
  label,
  onPress,
  selected,
  status,
}: {
  avatarUrl?: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  status: string;
}) {
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 rounded-xl border p-3 active:opacity-70",
        selected ? "border-primary bg-primary/10" : "border-border bg-background"
      )}
    >
      <Avatar alt={`${label} avatar`} className="size-8">
        {avatarUrl ? <AvatarImage source={{ uri: avatarUrl }} /> : null}
        <AvatarFallback>
          <Text className="text-xs font-extrabold text-foreground">{initial}</Text>
        </AvatarFallback>
      </Avatar>
      <View className="flex-1">
        <Text numberOfLines={1} className="font-semibold text-foreground">
          {label}
        </Text>
        <Text className="text-sm text-muted-foreground">{status}</Text>
      </View>
      {selected ? <Icon as={Check} className="size-5 text-primary" /> : null}
    </Pressable>
  );
}

function ResultUserChip({
  onPress,
  user,
}: {
  onPress?: (user: QuestionResultUserDTO) => void;
  user: QuestionResultUserDTO;
}) {
  const displayName = user.username || "Unknown";
  const content = (
    <>
      <MemberAvatar
        member={{
          userId: user.userId,
          name: displayName,
          avatarUrl: user.avatarUrl,
        }}
        sizeClassName="h-6 w-6"
      />
      <Text numberOfLines={1} className="max-w-32 text-sm font-semibold text-secondary">
        {displayName}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(user)}
        className="max-w-44 flex-row items-center gap-2 rounded-full border border-border bg-primary px-2 py-1.5 active:opacity-80"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="max-w-44 flex-row items-center gap-2 rounded-full border border-border bg-primary px-2 py-1.5">
      {content}
    </View>
  );
}

function MemberAvatar({
  member,
  sizeClassName = "size-8",
}: {
  member: SelectedMember;
  sizeClassName?: string;
}) {
  const initial = member.name.slice(0, 1).toUpperCase();

  return (
    <Avatar alt={`${member.name} avatar`} className={sizeClassName}>
      {member.avatarUrl ? <AvatarImage source={{ uri: member.avatarUrl }} /> : null}
      <AvatarFallback>
        <Text className="text-[10px] font-extrabold text-foreground">{initial}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

function findSelectedMember(
  userId: string,
  members: GroupMemberDTO[],
  results: QuestionResultDTO[],
  pairingResults: PairingResultDTO[]
): SelectedMember | null {
  const groupMember = members.find((member) => member.user === userId);
  if (groupMember) {
    return {
      userId: groupMember.user,
      name: groupMember.name,
      avatarUrl: groupMember.avatarUrl,
    };
  }

  const resultUser = findResultUser(userId, results, pairingResults);
  return resultUser
    ? {
        userId: resultUser.userId,
        name: resultUser.username || "Unknown",
        avatarUrl: resultUser.avatarUrl,
      }
    : null;
}

function findResultUser(
  userId: string,
  results: QuestionResultDTO[],
  pairingResults: PairingResultDTO[]
): QuestionResultUserDTO | undefined {
  for (const result of results) {
    const user = result.users.find((candidate) => candidate.userId === userId);
    if (user) return user;
  }

  for (const result of pairingResults) {
    for (const valueCount of result.valueCounts) {
      const user = valueCount.users.find((candidate) => candidate.userId === userId);
      if (user) return user;
    }
  }
}

function hasMemberVote(
  userId: string,
  results: QuestionResultDTO[],
  pairingResults: PairingResultDTO[]
) {
  return (
    results.some((result) => resultHasUser(result, userId)) ||
    pairingResults.some((result) =>
      result.valueCounts.some((valueCount) => valueCountHasUser(valueCount, userId))
    )
  );
}

function resultHasUser(result: QuestionResultDTO, userId: string) {
  return result.users.some((user) => user.userId === userId);
}

function valueCountHasUser(
  valueCount: PairingResultDTO["valueCounts"][number],
  userId: string
) {
  return valueCount.users.some((user) => user.userId === userId);
}

function ResultsDetailSkeleton() {
  return (
    <View className="gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} className="gap-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-24" />
          <View className="flex-row gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}
