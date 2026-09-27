import { createFileRoute } from "@tanstack/react-router";
import { BlogArticlePage } from "@/site";

export const Route = createFileRoute("/blogs/$slug")({
  component: BlogPost,
});

function BlogPost() {
  const { slug } = Route.useParams();
  return <BlogArticlePage slug={slug} />;
}
