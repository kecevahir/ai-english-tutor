import { ModulePlaceholder } from "@/components/shared/ModulePlaceholder";

export function ComingSoonPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <ModulePlaceholder title={title} phase={phase} description={description} />
  );
}
