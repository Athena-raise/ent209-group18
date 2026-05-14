import { useUserStore } from "../../store";
import { MuscleMapModal } from "./MuscleMapModal";

export function InsightsScreen() {
  const biologicalSex = useUserStore((state) => state.profile.biologicalSex);

  return (
    <MuscleMapModal
      open
      onOpenChange={() => undefined}
      sex={biologicalSex ?? "male"}
      withBottomNav
    />
  );
}
