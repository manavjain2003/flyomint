import { RouteDetailPage, routeDetailMetadata } from "@/app/components/cms/RoutePages";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const generateMetadata = routeDetailMetadata;

export default function Page(props: Props) {
    return <RouteDetailPage type="international" {...props} />;
}
