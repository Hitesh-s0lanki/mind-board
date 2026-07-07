import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center py-3">
      <a
        href="#top"
        className="flex min-h-12 items-center gap-3 rounded-md pr-2 focus:outline-none focus:ring-2 focus:ring-[#9df6cf] focus:ring-offset-2 focus:ring-offset-[#101513]"
        aria-label="Mindboard arena home"
      >
        <Image
          src="/logo.png"
          alt=""
          width={52}
          height={52}
          className="h-12 w-12 rounded-md object-contain"
          priority
        />
        <span>
          <span className="block text-sm font-black tracking-[0.18em] text-[#9df6cf]">
            Mindboard
          </span>
          <span className="block text-sm font-semibold text-[#c8d8ce]">
            Llm chess arena
          </span>
        </span>
      </a>
    </header>
  );
}
