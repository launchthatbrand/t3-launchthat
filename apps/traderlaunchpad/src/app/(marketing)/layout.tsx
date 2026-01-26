import { GridLines } from "~/components/background/GridLines";
import React from "react";
import { ShootingStars } from "@acme/ui";
import { headers } from "next/headers";

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headerList = await headers();
    const userAgent = headerList.get("user-agent") ?? "";
    const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    return (
        <div className="flex flex-col flex-1">
            <div className="relative">
                <div className="pointer-events-none absolute inset-0">
                    <GridLines />
                </div>
                {isMobileUa ? null : (
                    <ShootingStars
                        minSpeed={10}
                        maxSpeed={20}
                        minDelay={5000}
                        starColor="#9E00FF"
                        trailColor="#2EB9DF"
                        starWidth={10}
                        starHeight={1}
                    />
                )}
                {/* <Header /> */}
                {children}
            </div>
        </div>
    );
}
