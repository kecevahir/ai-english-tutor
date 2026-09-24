import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getDashboardData } from "@/services/dashboard/getDashboardData";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <AppHeader
        title="Dashboard"
        subtitle={`Welcome back, ${data.stats.displayName}`}
      />
      <DashboardView data={data} />
    </div>
  );
}
