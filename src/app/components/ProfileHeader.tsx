import avatarFemale from "../assets/avatar-female-transparent.png";
import avatarMale from "../assets/avatar-male-transparent.png";
import type { BiologicalSex } from "../../store";

interface ProfileHeaderProps {
  name: string;
  status?: string;
  sex?: BiologicalSex | null;
}

export function ProfileHeader({ name, status, sex }: ProfileHeaderProps) {
  const avatarSrc = sex === "female" ? avatarFemale : avatarMale;

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-[112px] h-[112px] rounded-[32px] bg-gradient-to-br from-[#E5F5E3] to-[#D1F0CD] flex items-end justify-center mb-5 shadow-sm border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-12 h-12 bg-[#34C759]/20 rounded-full blur-xl" />
        <img
          src={avatarSrc}
          alt=""
          aria-hidden="true"
          className="relative z-10 h-[106px] w-auto select-none object-contain"
          draggable={false}
        />
      </div>
      <h2 className="text-[28px] font-bold text-black tracking-tight leading-none mb-1.5">{name}</h2>
      {status ? (
        <div className="bg-[#34C759]/10 px-3.5 py-1.5 rounded-full">
          <p className="text-[14px] font-medium text-[#34C759] tracking-tight">{status}</p>
        </div>
      ) : null}
    </div>
  );
}
