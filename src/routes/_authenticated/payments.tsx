import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/PageHeader";
export const Route = createFileRoute("/_authenticated/payments")({ component: () => (<div><PageHeader title="Payments" subtitle="Receivables, payables, ledgers and bank accounts." /><ComingSoon feature="Payment Management & GST Billing" /></div>) });
