export default function DownloadApkPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-center">
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">EVERYA</p>
      <h1 className="font-serif text-3xl tracking-tight">Install the offline app</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-sm">
        Tap once. Android may ask you to allow installs from this browser.
      </p>
      <a
        href="/download/apk"
        className="mt-10 inline-flex h-14 w-full max-w-sm items-center justify-center rounded-full bg-foreground text-background text-base font-semibold"
      >
        Download EVERYA.apk
      </a>
    </main>
  );
}
