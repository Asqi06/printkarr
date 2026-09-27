import { createFileRoute } from "@tanstack/react-router";
import { TermsPage } from "@/site";

export const Route = createFileRoute("/terms")({ component: TermsPage });
