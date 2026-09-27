import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/site";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });
