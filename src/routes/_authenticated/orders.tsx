import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/PageHeader";
export const Route = createFileRoute("/_authenticated/orders")({ component: () => (<div><PageHeader title="Orders" subtitle="Active dispatches, vehicles, and bilty (LR)." /><ComingSoon feature="Order Lifecycle & Bilty" /></div>) });
