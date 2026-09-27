import { createFileRoute } from "@tanstack/react-router";
import { FranchisePage } from "@/site";

export const Route = createFileRoute("/franchise")({ component: FranchisePage });
