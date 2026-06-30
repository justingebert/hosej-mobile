import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useColorScheme, useWindowDimensions, View } from "react-native";
import Animated, { FadeInLeft, FadeInRight } from "react-native-reanimated";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { getOnboardingSeen, setOnboardingSeen } from "@/lib/onboarding";
import { StepIndicator } from "./step-indicator";
import { ChatStep } from "./steps/chat-step";
import { CreateStep } from "./steps/create-step";
import { DailyQuestionsStep } from "./steps/daily-questions-step";
import { HistoryStatsStep } from "./steps/history-stats-step";
import { WelcomeStep } from "./steps/welcome-step";

const STEPS = [WelcomeStep, DailyQuestionsStep, CreateStep, ChatStep, HistoryStatsStep];

// Fits the tallest step's content + sheet chrome (grabber, indicator, footer).
const SHEET_HEIGHT = 560;

export type OnboardingSheetRef = { present: () => void };

export const OnboardingSheet = forwardRef<OnboardingSheetRef>(function OnboardingSheet(_, ref) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Fixed height tuned to fit the tallest step (History & Stats) so the sheet
  // never resizes between steps; capped so it always fits the screen. The body is
  // top-aligned (see contentContainerStyle) so every step's StepHeader lands at the
  // same place; shorter steps just leave space below. Nudge SHEET_HEIGHT if step
  // content changes.
  const sheetHeight = Math.min(SHEET_HEIGHT, Math.round(height * 0.9));
  const snapPoints = useMemo(() => [sheetHeight], [sheetHeight]);

  // Solid sheet background (with rounded top) so the bottom overdraw region isn't
  // transparent — same themed surface root-navigator uses for `--background`.
  const scheme = useColorScheme();
  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: scheme === "dark" ? "#0a0a0a" : "#ffffff",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    }),
    [scheme]
  );

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = STEPS.length;
  const isLast = step === total - 1;
  const Current = STEPS[step];

  useImperativeHandle(ref, () => ({ present: () => modalRef.current?.present() }), []);

  const next = () => {
    if (isLast) {
      modalRef.current?.dismiss();
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const back = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  // Fires on any close (Get Started, Skip, swipe-down, backdrop). Persist once and
  // reset so a replay (from Help) starts at the first step.
  const handleDismissed = () => {
    void setOnboardingSeen();
    setStep(0);
    setDirection(1);
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      handleComponent={null}
      backgroundStyle={backgroundStyle}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismissed}
    >
      <BottomSheetView style={{ height: sheetHeight }}>
        <View className="flex-1">
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </View>

          <View className="flex-row items-center justify-between px-5 pb-1">
            <StepIndicator total={total} current={step} />
            <Button variant="link" size="sm" onPress={() => modalRef.current?.dismiss()}>
              <Text>Skip</Text>
            </Button>
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-start",
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View key={step} entering={direction >= 0 ? FadeInRight : FadeInLeft}>
              <Current />
            </Animated.View>
          </BottomSheetScrollView>

          <View
            className="flex-row gap-3 px-5 pt-2"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            {step > 0 ? (
              <Button variant="outline" className="flex-1" onPress={back}>
                <Text>Back</Text>
              </Button>
            ) : (
              <View className="flex-1" />
            )}
            <Button className="flex-1" onPress={next}>
              <Text>{isLast ? "Get Started" : "Next"}</Text>
              <Icon as={ChevronRight} className="size-4" />
            </Button>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

/**
 * Auto-presents the onboarding sheet once per fresh install — on the groups root,
 * after the user is fully authed (past the name-setup bounce) and only if unseen.
 */
export function useAutoPresentOnboarding(ref: RefObject<OnboardingSheetRef | null>) {
  const { status, needsNameSetup } = useAuth();
  const presented = useRef(false);

  useEffect(() => {
    if (presented.current || status !== "authed" || needsNameSetup) return;
    presented.current = true;
    let active = true;
    void getOnboardingSeen().then((seen) => {
      if (active && !seen) ref.current?.present();
    });
    return () => {
      active = false;
    };
  }, [status, needsNameSetup, ref]);
}
