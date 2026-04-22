import Nav from "@/components/layout/navigation/Nav";
import ProfileNavcard from "@/components/ui/profilecard/ProfileNavcard";
import LeftNav from "@/components/layout/navigation/LeftNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <div className="w-full h-18"></div>
      <div className="Pagearea flex items-start gap-6 xl:gap-6 2xl:gap-6">
        <nav className="w-[25%] hidden lg:block shrink-0 sticky top-22.5 h-[calc(100vh-108px)] rounded-t-lg">
          <div className="w-full overflow-y-hidden h-full flex flex-col gap-4">
            <ProfileNavcard />
            <LeftNav />
          </div>
        </nav>
        <div className="w-full pt-4.5 flex items-start">{children}</div>
      </div>
    </>
  );
}
