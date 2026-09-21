import { ReaderTopBar } from "@/components/layout/reader-top-bar";
import { SearchModal } from "@/components/search/search-modal";

export default function PublicationArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReaderTopBar />
      <main className="flex-1">{children}</main>
      <SearchModal />
    </div>
  );
}
