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
        "hover:bg-nav-hover",
        isActive
          ? "bg-nav-hover font-semibold text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => onClick(id)}
    >
      {/* Single active indicator */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 bg-nav-active transition-transform duration-300 origin-top",
          isActive ? "scale-y-100" : "scale-y-0"
        )}
      />
      <span className="relative z-10">{label}</span>
    </li>
  );
}
