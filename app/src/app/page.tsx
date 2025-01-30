import { VideoRecorder } from '@/components/VideoRecorder';

export default function Home() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Video Recorder</h1>
      <VideoRecorder />
    </main>
  );
}
