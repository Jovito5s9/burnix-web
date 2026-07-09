import { PublicEventPage } from "@/components/public/public-event-page";

type EventPublicPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventPublicPage({ params }: EventPublicPageProps) {
  const { id } = await params;

  return <PublicEventPage id={id} />;
}
