import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/PageHeader";
export const Route = createFileRoute("/_authenticated/reports")({ component: () => (<div><PageHeader title="Reports" subtitle="Profit per order, party-wise outstanding, monthly summaries." /><ComingSoon feature="Reporting & Analytics" /></div>) });
