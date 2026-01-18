import { DottedGlowBackground } from "@acme/ui";
import { Header } from "../../components/landing/Header";
import React from "react";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="fixed inset-0 z-0 overflow-hidden">
                <DottedGlowBackground
                    color="rgba(255, 100, 0, 0.15)"
                    glowColor="rgba(255, 120, 0, 0.55)"
                    gap={24}
                    radius={1.5}
                    speedMin={0.2}
                    speedMax={0.8}
                />
                <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/18 blur-[120px]" />
                <div className="absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-orange-500/10 blur-[120px]" />
            </div>
            <Header />
            {children}
        </>
    );
}
