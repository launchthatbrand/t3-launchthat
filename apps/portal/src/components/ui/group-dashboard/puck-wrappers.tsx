import { ReactNode } from "react";

import type { ContainerProps } from "./Container";
import type { GridProps } from "./Grid";
import type { TextProps } from "./Text";
import { ActivitySummary } from "./ActivitySummary";
import { Announcements } from "./Announcements";
import { Container } from "./Container";
import { Discussions } from "./Discussions";
import { Grid } from "./Grid";
import { GroupOverview } from "./GroupOverview";
import { Text } from "./Text";
import { UpcomingEventsMembers } from "./UpcomingEventsMembers";

// Add an interface for wrapped component props
export interface PuckWrappedComponentProps {
  id?: string;
  props?: Record<string, unknown>;
  children?: ReactNode;
}

// Define types for the component props
export interface GroupOverviewProps {
  title?: string;
  description?: string;
  categoryTags?: string[];
  creationTime?: number;
}

export interface ActivitySummaryProps {
  title?: string;
  description?: string;
  memberCount?: number;
  postCount?: number;
  eventCount?: number;
  activeMembers?: number;
  isLoading?: boolean;
}

export interface AnnouncementsProps {
  title?: string;
  description?: string;
  groupId?: string;
  isLoading?: boolean;
}

export interface DiscussionsProps {
  title?: string;
  description?: string;
  groupId?: string;
  columnSpan?: string;
  isLoading?: boolean;
}

export interface UpcomingEventsMembersProps {
  title?: string;
  description?: string;
  groupId?: string;
  isLoading?: boolean;
}

// Add wrappers for all components to ensure keys are properly passed
export const WrappedContainer = ({
  id,
  props,
  children,
  ...rest
}: PuckWrappedComponentProps & Partial<ContainerProps>) => {
  return (
    <Container key={id} {...props} {...rest}>
      {children}
    </Container>
  );
};

export const WrappedGrid = ({
  id,
  props,
  children,
  ...rest
}: PuckWrappedComponentProps & Partial<GridProps>) => {
  return (
    <Grid key={id} {...props} {...rest}>
      {children}
    </Grid>
  );
};

export const WrappedText = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<TextProps>) => {
  return <Text key={id} {...props} {...rest} />;
};

export const WrappedGroupOverview = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<GroupOverviewProps>) => {
  return <GroupOverview key={id} {...props} {...rest} />;
};

export const WrappedActivitySummary = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<ActivitySummaryProps>) => {
  return <ActivitySummary key={id} {...props} {...rest} />;
};

export const WrappedAnnouncements = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<AnnouncementsProps>) => {
  return <Announcements key={id} {...props} {...rest} />;
};

export const WrappedDiscussions = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<DiscussionsProps>) => {
  return <Discussions key={id} {...props} {...rest} />;
};

export const WrappedUpcomingEventsMembers = ({
  id,
  props,
  ...rest
}: PuckWrappedComponentProps & Partial<UpcomingEventsMembersProps>) => {
  return <UpcomingEventsMembers key={id} {...props} {...rest} />;
};
