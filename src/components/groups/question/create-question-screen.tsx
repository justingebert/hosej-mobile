import { useState } from "react";
import { useGroupId } from "@/lib/group-id";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { List, ListChecks, type LucideIcon, Plus, Star, Trash, Type, Users } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Screen } from "@/components/ui/screen";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useGroup } from "@/lib/api/groups";
import { useCreateQuestion } from "@/lib/api/questions";
import { useUser } from "@/lib/api/user";
import { QuestionType } from "@/lib/api/types/question";
import { toastSuccess } from "@/lib/toast";

type TypeMeta = {
  type: QuestionType;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

// v1 supports the four option-free / text-option types. Pairing + image come later.
const TYPES: TypeMeta[] = [
  { type: QuestionType.Users, label: "Members", blurb: "Vote on each other", icon: Users },
  { type: QuestionType.Custom, label: "Custom", blurb: "Your own options", icon: List },
  { type: QuestionType.Text, label: "Text", blurb: "Free-form answer", icon: Type },
  { type: QuestionType.Rating, label: "Rating", blurb: "Rate 1–10", icon: Star },
];

const MIN_CUSTOM_OPTIONS = 2;
const MULTISELECT_TYPES: QuestionType[] = [QuestionType.Users, QuestionType.Custom];

export function CreateQuestionScreen() {
  const groupId = useGroupId();
  const { data: group, isPending: groupPending, isError: groupError } = useGroup(groupId);
  const { data: user } = useUser();
  const createQuestion = useCreateQuestion(groupId);
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<QuestionType | null>(null);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);

  const members = group?.members ?? [];

  const selectType = (next: QuestionType) => {
    setType(next);
    setOptions(next === QuestionType.Custom ? ["", ""] : []);
    setMultiSelect(false);
  };

  const setOption = (value: string, index: number) =>
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  const addOption = () => setOptions((prev) => [...prev, ""]);
  const removeOption = (index: number) =>
    setOptions((prev) => prev.filter((_, i) => i !== index));

  const trimmedOptions = options.map((opt) => opt.trim()).filter(Boolean);
  const optionsValid =
    type !== QuestionType.Custom || trimmedOptions.length >= MIN_CUSTOM_OPTIONS;
  const canSubmit =
    !!groupId &&
    !!type &&
    !!user &&
    question.trim().length > 0 &&
    optionsValid &&
    !createQuestion.isPending;

  const handleSubmit = () => {
    if (!type || !user) return;
    createQuestion.mutate(
      {
        category: "Daily",
        questionType: type,
        question: question.trim(),
        submittedBy: user._id,
        multiSelect,
        options: type === QuestionType.Custom ? trimmedOptions : [],
      },
      {
        onSuccess: () => {
          setType(null);
          setQuestion("");
          setOptions(["", ""]);
          setMultiSelect(false);
          toastSuccess("Question created", "Added to the pool");
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen contentContainerClassName="grow gap-6 px-4 pt-4 pb-28">
      <View className="gap-3">
        <Text className="text-2xl font-extrabold text-foreground">Create a new question</Text>

        <TextInput
          multiline
          placeholder="Ask your group something…"
          value={question}
          onChangeText={setQuestion}
          className="min-h-24 rounded-xl bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      <View className="flex-row flex-wrap gap-3">
        {TYPES.map(({ type: t, label, blurb, icon: TypeIcon }) => {
          const selected = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => selectType(t)}
              className={`rounded-2xl border p-4 ${
                selected ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
              style={{ borderCurve: "continuous", flexBasis: "47%", flexGrow: 1 }}
            >
              <View className="flex-row items-center gap-2">
                <Icon as={TypeIcon} className={`size-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <Text className="font-bold text-foreground">{label}</Text>
              </View>
              <Text className="mt-2 text-xs text-muted-foreground">{blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      {type ? (
        <View className="gap-6">
          {type === QuestionType.Custom ? (
            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground">Options</Text>
              {options.map((opt, index) => {
                const canRemove = options.length > MIN_CUSTOM_OPTIONS;
                return (
                  <View key={index} className="relative">
                    <TextInput
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onChangeText={(value) => setOption(value, index)}
                      className={`rounded-xl border border-border bg-card py-3 pl-4 text-base text-foreground placeholder:text-muted-foreground ${
                        canRemove ? "pr-12" : "pr-4"
                      }`}
                    />
                    {canRemove ? (
                      <Pressable
                        onPress={() => removeOption(index)}
                        hitSlop={8}
                        className="absolute bottom-0 right-1 top-0 justify-center px-4"
                        accessibilityLabel={`Remove option ${index + 1}`}
                      >
                        <Icon as={Trash} className="size-5 text-destructive" />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
              <Button variant="outline" onPress={addOption}>
                <Icon as={Plus} className="size-4" />
                <Text>Add option</Text>
              </Button>
            </View>
          ) : null}

          {type === QuestionType.Users ? (
            <View className="gap-3">
              <Text className="text-sm font-medium text-foreground">Options</Text>
              {groupPending ? (
                <View className="flex-row flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-20 rounded-full" />
                  ))}
                </View>
              ) : groupError ? (
                <Text className="text-sm text-muted-foreground">
                  Couldn't load members. Pull to refresh.
                </Text>
              ) : members.length === 0 ? (
                <Text className="text-sm text-muted-foreground">
                  No members in this group yet.
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {members.map((member) => (
                    <View key={member.user} className="rounded-full bg-secondary px-3 py-1">
                      <Text className="text-xs text-secondary-foreground">{member.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {MULTISELECT_TYPES.includes(type) ? (
            <Pressable
              onPress={() => setMultiSelect((prev) => !prev)}
              className={`flex-row items-center justify-between gap-3 rounded-2xl border px-5 py-3 ${
                multiSelect ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
              style={{ borderCurve: "continuous" }}
            >
              <View className="flex-row items-center gap-2">
                <Icon as={ListChecks} className="size-5 text-foreground" />
                <Text className="font-semibold text-foreground">Allow multiple answers</Text>
              </View>
              <Checkbox checked={multiSelect} onCheckedChange={setMultiSelect} />
            </Pressable>
          ) : null}

        </View>
      ) : null}
      </Screen>

      <View
        className="absolute inset-x-0 bottom-0 bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button onPress={handleSubmit} disabled={!canSubmit}>
          <Text>{createQuestion.isPending ? "Creating…" : "Create question"}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
