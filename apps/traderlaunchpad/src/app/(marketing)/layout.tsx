import { DottedGlowBackground } from "@acme/ui";
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
            <Header />
            {children}
        </div>
    );
}
