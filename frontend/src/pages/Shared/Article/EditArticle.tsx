import React from "react";
import DashboardLayout from "@/components/PageBuilder/Layouts/DashboardLayout";
import { EditArticleForm } from "@/components/Shared/Articles/EditArticleForm";

const EditArticle: React.FC = () => {
  return (
    <DashboardLayout>
      <EditArticleForm />
    </DashboardLayout>
  );
};

export default EditArticle;
