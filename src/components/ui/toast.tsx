import { View } from "react-native";
import { CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react-native";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

// Status tokens from global.css so accents follow the active theme. Reusable
// anywhere as `text-success` / `bg-info/15` / `text-destructive`, etc.
const VARIANTS = {
  success: { icon: CheckCircle2, iconClassName: "text-success", chipClassName: "bg-success/15" },
  error: { icon: XCircle, iconClassName: "text-destructive", chipClassName: "bg-destructive/15" },
  info: { icon: Info, iconClassName: "text-info", chipClassName: "bg-info/15" },
} satisfies Record<string, { icon: LucideIcon; iconClassName: string; chipClassName: string }>;

function BaseToast({
  variant,
  text1,
  text2,
}: {
  variant: keyof typeof VARIANTS;
  text1?: string;
  text2?: string;
}) {
  const { icon, iconClassName, chipClassName } = VARIANTS[variant];
  return (
    <View
      className="w-11/12 max-w-md flex-row items-center gap-3 self-center rounded-2xl border border-border bg-card px-4 py-3 shadow-lg shadow-black/10"
      style={{ borderCurve: "continuous" }}
    >
      <View
        className={cn("h-9 w-9 items-center justify-center rounded-full", chipClassName)}
        style={{ borderCurve: "continuous" }}
      >
        <Icon as={icon} className={cn("size-5", iconClassName)} />
      </View>
      <View className="flex-1 gap-0.5">
        {text1 ? (
          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const render = (variant: keyof typeof VARIANTS) => {
  function ToastRenderer(props: ToastConfigParams<unknown>) {
    return <BaseToast variant={variant} text1={props.text1} text2={props.text2} />;
  }

  ToastRenderer.displayName = `${variant}Toast`;
  return ToastRenderer;
};

export const toastConfig: ToastConfig = {
  success: render("success"),
  error: render("error"),
  info: render("info"),
};
