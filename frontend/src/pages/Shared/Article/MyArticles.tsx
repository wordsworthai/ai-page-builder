import DashboardLayout from "@/components/PageBuilder/Layouts/DashboardLayout";
import { ArticlesList } from "@/components/Shared/Articles/ArticlesList";

export default function MyArticles() {
  return (
    <DashboardLayout>
      <ArticlesList />
    </DashboardLayout>
  );
}
