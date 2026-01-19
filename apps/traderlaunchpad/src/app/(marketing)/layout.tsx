import { DottedGlowBackground } from "@acme/ui";
import { GridLines } from "~/components/background/GridLines";
import { Header } from "../../components/landing/Header";
import Link from "next/link";
import React from "react";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col flex-1">
            <div className="relative">
                <div className="pointer-events-none absolute inset-0">
                    <GridLines />
                </div>

                <Header />
                {children}
            </div>




        </div>
    );
}
