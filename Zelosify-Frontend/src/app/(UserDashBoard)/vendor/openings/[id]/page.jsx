import VendorOpeningDetailPage from "@/components/UserDashboardPage/IT_VENDOR/Openings/VendorOpeningDetailPage";

export default async function OpeningDetailPage({ params }) {
  const { id } = await params;
  return (
    <div className="w-full">
      <VendorOpeningDetailPage id={id} />
    </div>
  );
}