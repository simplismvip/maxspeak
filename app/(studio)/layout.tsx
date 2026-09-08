import { SiteHeader } from '@/components/marketing/SiteHeader';
import { StudioShell } from '@/components/studio/StudioShell';
import { AudioPlayer } from '@/components/player/AudioPlayer';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <StudioShell>{children}</StudioShell>
      <AudioPlayer />
    </div>
  );
}
