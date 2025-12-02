import { Separator } from "@acme/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Calendar } from "@acme/ui/calendar";
import AvailabilityChecker from "@acme/ui/calendar/components/availability-checker";
import { EventsProvider } from "@acme/ui/calendar/context/events-context";

export default function Home() {
  return (
    <EventsProvider>
      <div className="py-4">
        <Tabs
          defaultValue="calendar"
          className="flex w-full flex-col items-center"
        >
          <TabsList className="mb-2 flex justify-center">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="schedulingAssistant">
              Scheduling Assistant
            </TabsTrigger>
          </TabsList>
          <TabsContent value="calendar" className="w-full space-y-5 px-5">
            <div className="space-y-0">
              <h2 className="flex items-center text-2xl font-semibold tracking-tight md:text-3xl">
                Calendar
              </h2>
              <p className="text-xs font-medium md:text-sm">
                A flexible calendar component with drag and drop capabilities
                built using FullCalendar and shadcn/ui.
              </p>
            </div>

            <Separator />
            <Calendar />
          </TabsContent>
          <TabsContent
            value="schedulingAssistant"
            className="w-full space-y-5 px-5"
          >
            <div className="space-y-0">
              <h2 className="flex items-center text-2xl font-semibold tracking-tight md:text-3xl">
                Scheduling Assistant
              </h2>
              <p className="text-xs font-medium md:text-sm">
                A scheduling assistant built to analyze a user&apos;s schedule
                and automatically show open spots.
              </p>
            </div>
            <Separator />
            <AvailabilityChecker />
          </TabsContent>
        </Tabs>
      </div>
    </EventsProvider>
  );
}
