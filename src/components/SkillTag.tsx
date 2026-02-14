import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface SkillTagProps {
  skill: string;
  variant?: "teach" | "learn" | "default";
  onRemove?: () => void;
}

export default function SkillTag({ skill, variant = "default", onRemove }: SkillTagProps) {
  const variantClasses = {
    teach: "bg-primary/10 text-primary border-primary/20",
    learn: "bg-accent text-accent-foreground border-accent-foreground/20",
    default: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={`gap-1 ${variantClasses[variant]}`}>
      {skill}
      {onRemove && (
        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={onRemove} />
      )}
    </Badge>
  );
}
