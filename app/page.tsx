import TaskTracker from "./components/TaskTracker";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start">
      {/* Animated mesh background */}
      <div className="bg-mesh">
        <div className="bg-mesh-extra" />
      </div>

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Main content */}
      <TaskTracker />
    </main>
  );
}
