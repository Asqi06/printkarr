import { createFileRoute } from "@tanstack/react-router";
import { HomeRoute } from "@/site";

export const Route = createFileRoute("/")({ component: HomeRoute });
