import { cn } from "@/lib/utils";

interface NavigationItemProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function NavigationItem({ id, label, isActive, onClick }: NavigationItemProps) {
  return (
    <li
      className={cn(
        "relative px-4 py-3 cursor-pointer transition-all duration-300 ease-smooth",
        "border-l-2 hover:bg-nav-hover",
        isActive
          ? "border-nav-active bg-nav-hover font-semibold text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
      onClick={() => onClick(id)}
    >
      <span className="relative z-10">{label}</span>
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-nav-active animate-in slide-in-from-left-2 duration-300" />
      )}
    </li>
  );
}
