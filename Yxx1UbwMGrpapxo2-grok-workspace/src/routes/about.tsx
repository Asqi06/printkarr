import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/site";

export const Route = createFileRoute("/about")({ component: AboutPage });
