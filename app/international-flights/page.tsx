import { RouteListPage, routeListMetadata } from "@/app/components/cms/RoutePages";

export const metadata = routeListMetadata("international");

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    return <RouteListPage type="international" searchParams={searchParams} />;
}
