import { createContext, useContext, type ReactNode } from "react";

const GroupIdContext = createContext<string | null>(null);

export function GroupIdProvider({
  groupId,
  children,
}: {
  groupId: string;
  children: ReactNode;
}) {
  return <GroupIdContext.Provider value={groupId}>{children}</GroupIdContext.Provider>;
}

// Screens under `groups/[groupId]/` read the id from here instead of
// `useLocalSearchParams`, which returns {} in nested tab screens
// (expo-router #27472 / #27992). The id is read once from the URL in the layout.
export function useGroupId(): string {
  const groupId = useContext(GroupIdContext);
  if (!groupId) {
    throw new Error("useGroupId must be used within a GroupIdProvider");
  }
  return groupId;
}
