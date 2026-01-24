import React from "react";
import { ReviewsSection } from "~/components/reviews/ReviewsSection";

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  return (
    <>
      <ReviewsSection
        target={{ kind: "user", username: decoded }}
        title="Reviews"
        subtitle="Feedback from other traders"
      />

      <div className="h-24" />
    </>
  );
}
