import React from "react";
import DashboardLayout from "@/components/PageBuilder/Layouts/DashboardLayout";
import { CreateArticleForm } from "@/components/Shared/Articles/CreateArticleForm";

const CreateArticle: React.FC = () => {
  return (
    <DashboardLayout>
      <CreateArticleForm />
    </DashboardLayout>
  );
};

export default CreateArticle;
