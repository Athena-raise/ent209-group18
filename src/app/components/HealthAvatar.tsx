import { motion } from "motion/react";
import avatarFemale from "../assets/avatar-female-transparent.png";
import avatarMale from "../assets/avatar-male-transparent.png";
import type { BiologicalSex } from "../../store";

interface HealthAvatarProps {
  mood: "tired" | "relaxed" | "energetic";
  sex?: BiologicalSex | null;
  onClick?: () => void;
}

export function HealthAvatar({ mood, sex, onClick }: HealthAvatarProps) {
  const selectedSex = sex ?? "male";
  const avatarSrc = selectedSex === "female" ? avatarFemale : avatarMale;
  const glow =
    mood === "energetic"
      ? "rgba(103, 199, 122, 0.18)"
      : mood === "tired"
        ? "rgba(183, 162, 203, 0.18)"
        : "rgba(139, 184, 222, 0.18)";

  return (
    <div className="relative mx-auto h-72 w-52">
      <button
        type="button"
        onClick={onClick}
        aria-label="Open muscle map"
        className="group relative h-full w-full rounded-[28px] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#67C77A]/25"
      >
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
          style={{ filter: `drop-shadow(0 24px 52px ${glow})` }}
        >
          <img
            src={avatarSrc}
            alt=""
            aria-hidden="true"
            className="relative h-full w-auto select-none object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            draggable={false}
          />
        </motion.div>
      </button>
    </div>
  );
}
