interface PageIntroProps {
  kicker: string;
  title: string;
  description: string;
}

export function PageIntro({ kicker, title, description }: PageIntroProps) {
  return (
    <header className="space-y-4 text-center md:space-y-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {kicker}
      </p>
      <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h1>
      <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
        {description}
      </p>
    </header>
  );
}
