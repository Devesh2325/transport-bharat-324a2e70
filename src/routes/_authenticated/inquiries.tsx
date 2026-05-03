import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, ComingSoon } from "@/components/PageHeader";
export const Route = createFileRoute("/_authenticated/inquiries")({ component: () => (<div><PageHeader title="Inquiries" subtitle="Capture incoming load requests from clients." /><ComingSoon feature="Inquiry Management" /></div>) });
