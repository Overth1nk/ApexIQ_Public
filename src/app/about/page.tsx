import React from "react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl font-bold tracking-tighter">
                        About <span className="text-primary">ApexIQ</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Precision Telemetry Analysis for the Modern Racer.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-8 bg-racing-red rounded-full"></span>
                            My Mission
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ApexIQ is designed to bridge the gap between raw data and actionable
                            insights. I believe that every driver and session, from occasional outings to
                            professional events, deserves access to high-grade telemetry
                            analysis without the complexity of traditional engineering software.
                        </p>
                    </div>

                    <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-8 bg-racing-red rounded-full"></span>
                            Technology
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Powered by AI and machine learning algorithms, ApexIQ
                            processes your racing data to identify key areas for improvement.
                            My platform analyzes braking points, throttle application,
                            racing lines, and much more to help you find those elusive tenths of a second.
                        </p>
                    </div>
                </div>

                <div className="mt-12 p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-8 bg-racing-red rounded-full"></span>
                        About Me, Maayan Pollack
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        I started ApexIQ because I’ve always enjoyed digging into my own driving and finding small ways to improve. Building this platform became a natural blend of my interest in racing and my love for creating tools that feel smooth and enjoyable to use. I’m driven by curiosity, constant learning, and the idea that good design can make complex things feel simple.
                    </p>
                </div>

                <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-track-grey to-carbon-black text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold mb-4">Ready to go faster?</h3>
                        <p className="text-gray-300 mb-6 max-w-xl">
                            Join the community of drivers using ApexIQ to lower their lap times
                            and understand their driving like never before.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-racing-red opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                </div>
            </div>
        </div>
    );
}
