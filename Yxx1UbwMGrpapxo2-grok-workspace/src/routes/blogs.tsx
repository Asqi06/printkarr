import { createFileRoute } from "@tanstack/react-router";
import { BlogsPage } from "@/site";

export const Route = createFileRoute("/blogs")({ component: BlogsPage });
