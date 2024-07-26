import TrackInteractions from "@/components/track-interactions";

export default function Generic({ tabUrl }: { tabUrl: string }) {
  return (
    <div className="fp-flex fp-flex-col fp-gap-3">
      <div>Generic strategy</div>
      <TrackInteractions tabUrl={tabUrl} />
    </div>
  );
}
