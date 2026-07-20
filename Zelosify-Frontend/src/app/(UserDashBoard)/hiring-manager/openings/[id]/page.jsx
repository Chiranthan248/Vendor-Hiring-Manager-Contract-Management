import HiringManagerProfilesPage from "@/components/UserDashboardPage/HIRING_MANAGER/HiringManagerProfilesPage";

export default async function ManagerProfilesPage({ params }) {
  const { id } = await params;
  return (
    <div className="w-full">
      <HiringManagerProfilesPage id={id} />
    </div>
  );
}