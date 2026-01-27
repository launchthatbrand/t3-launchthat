import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Car,
  Clock,
  FileText,
  Info,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { Separator } from "@acme/ui/separator";
import { cn } from "@acme/ui";

export default function ImpairedDrivingPage() {
  return (
    <main className="bg-background min-h-screen font-sans">
      {/* Top Banner / Hero */}
      <div className="relative h-[800px] w-full overflow-hidden text-white">
        {/* Hero Image */}
        <img
          src="/Web%20Assets/Hero.png"
          alt="Impaired Driving Hero"
          className="absolute inset-0 z-0 h-full w-full object-cover object-top"
        />
        {/* Gradient Overlay for Text Readability - Adjusted to be darker on left */}
        {/* <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0"></div> */}



        <div className="relative z-10 container mx-auto px-6 pt-32 md:pt-40 md:pb-48">
          <div className="max-w-2xl flex flex-col gap-6">
            {/* FDOT Logo */}
            <div className="absolute top-8 left-8 z-10">
              <img
                src="/Web%20Assets/FDOT%20Logo_K.png"
                alt="FDOT Logo"
                className="h-28 w-auto"
              />
            </div>
            {/* Title Block with Red Background Effect */}
            <div className="relative mb-6">
              {/* Red pill background */}
              <div className="absolute inset-0 -left-[100vw] w-[calc(100vw+100%)] rounded-r-full bg-gradient-to-r from-red-700/50 to-red-500/50"></div>

              <h1 className="relative text-shadow-md z-10 py-3 pr-8 pl-0 text-4xl leading-tight font-black tracking-tight italic md:text-5xl">
                Impaired Driving in Florida
              </h1>
            </div>

            <div className="relative mb-6">
              {/* black gradient background */}
              <div className="absolute -inset-5 -left-[100vw] w-[calc(100vw+90%)] bg-gradient-to-r from-black/30 to-black/30"></div>

              <p className="max-w-xl text-xl leading-relaxed font-bold text-white drop-shadow-xl text-shadow-lg">
                Impaired driving remains one of the most serious and preventable
                safety issues on Florida’s roadways. Driving under the influence
                of alcoholic beverages, controlled substances, prescriptions, or
                over-the-counter medications can cause impairment and inhibit your
                ability to drive safely.
              </p>
            </div>



          </div>
        </div>
      </div>

      <div className="w-full space-y-20">
        {/* Intro Section: Text + Stats */}
        <section className="container px-10 mt-20 max-w-7xl mx-auto grid items-start gap-12 lg:grid-cols-2">
          {/* Left Column: Text */}
          <div className="space-y-6">
            <p className="text-xl leading-relaxed text-slate-700">
              Impairment is not limited to alcohol. Drugs, including illegal
              substances, prescription medications, and some over-the-counter
              products, can also affect judgment, coordination, reaction time,
              and decision making.
            </p>
            <p className="text-xl leading-relaxed font-semibold text-slate-800">
              When drivers are impaired, the risk of a serious or fatal crash
              increases for everyone on the road. Every safe choice behind the
              wheel helps protect lives and supports Florida’s goal of zero
              transportation-related fatalities and serious injuries.
            </p>
          </div>

          {/* Right Column: Stats with Icons */}
          <div className="space-y-8 lg:pl-8">
            <div className="flex items-center gap-4 mx-auto max-w-7xl w-full">
              <div className="shrink-0">
                <img
                  src="/Web%20Assets/Icons-01.png"
                  alt="48 minutes icon"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div>
                <p className="text-xl leading-tight">
                  <span className="text-xl font-extrabold text-[#1c3e6f]">
                    EVERY 48
                  </span>{" "}
                  <span className="font-medium text-[#1c3e6f]">
                    minutes, there is another <br className="hidden sm:block" />
                    alcohol-impaired-driving fatality.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <img
                  src="/Web%20Assets/Icons-02.png"
                  alt="13 seconds icon"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div>
                <p className="text-xl leading-tight">
                  <span className="text-xl font-extrabold text-[#1c3e6f]">
                    EVERY 13
                  </span>{" "}
                  <span className="font-medium text-[#1c3e6f]">
                    seconds another <br className="hidden sm:block" />
                    person is injured.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <img
                  src="/Web%20Assets/Icons-03.png"
                  alt="7 seconds icon"
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div>
                <p className="text-xl leading-tight">
                  <span className="text-xl font-extrabold text-[#1c3e6f]">
                    EVERY 7
                  </span>{" "}
                  <span className="font-medium text-[#1c3e6f]">
                    seconds there is <br className="hidden sm:block" />
                    another property damage crash.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Divider Line */}
        <div className="container max-w-7xl mx-auto w-full px-6">
          <img
            src="/Web%20Assets/Divider%20Line.png"
            alt="Divider"
            className="h-28 w-full object-cover"
          />
        </div>

        {/* Impaired Driving Images Section */}
        <section className="container max-w-7xl mx-auto space-y-8 px-10">
          <div className="text-center">
            <h2 className="text-5xl font-black tracking-tight text-[#1c3e6f] uppercase italic">
              Impaired Driving
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col items-center">
              <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <img
                  src="/Web%20Assets/Don't%20Drive%20High%20Image.png"
                  alt="Don't Drive High"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <h3 className="text-center text-xl font-black text-[#1c3e6f] uppercase md:text-2xl">
                Don’t Drive High:{" "}
                <span className="line-through decoration-red-600 decoration-4">
                  Reaction Time
                </span>
              </h3>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-3xl">
                <img
                  src="/Web%20Assets/Impaired%20Driver%20Image.png"
                  alt="Impaired Driver"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <h3 className="text-center text-xl font-black text-[#1c3e6f] uppercase md:text-2xl">
                Drive Sober or Get Pulled Over
              </h3>
            </div>
          </div>
        </section>

        {/* FACTS Section */}
        <section className="relative my-12 w-full overflow-hidden p-16 md:py-34">
          {/* Background Image (Road) */}
          <div className="absolute inset-0 z-0 bg-slate-500">
            {/* <img
              src="/Web%20Assets/FACTS%20Image.png"
              alt="Road Background"
              className="w-full h-full object-cover"
            /> */}
          </div>

          <div className="relative z-10 container mx-auto flex gap-10 p-22">
            <div className="absolute inset-0 z-0">
              <img
                src="/Web%20Assets/FACTS.png"
                alt="Road Background"
                width={1000}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="w-1/4"></div>
            <div className="z-10">
              <div className="flex flex-grow items-center">
                <ul className="space-y-5 text-xl leading-snug font-medium text-black md:text-2xl">
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      In 2022, 29% of Florida traffic fatalities involved
                      impaired drivers.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      Alcohol, as well as, drugs, including illegal substances,
                      prescription medications, and over-the-counter products
                      can cause impairment.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      Every 48 minutes, there is another
                      alcohol-impaired-driving fatality.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      Every 13 seconds, another person is injured due to
                      impaired driving.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      Every 7 seconds, there is another property damage crash.
                    </span>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#1c3e6f] text-black"></span>
                    <span>
                      Your driver's license could be suspended for up to 2 years
                      if convicted of a DUI.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Engineering & Enforcement Section */}
        <section className="container px-10 space-y-16 py-12">
          {/* Divider Line */}
          <div className="w-full">
            <img
              src="/Web%20Assets/Divider%20Line.png"
              alt="Divider"
              className="h-28 w-full object-cover"
            />
          </div>

          <div className="container mx-auto grid gap-12 px-6 md:grid-cols-2 lg:gap-24">
            <div className="space-y-6">
              <div className="flex h-22 flex-col items-center justify-center">
                <h3 className="text-center text-3xl leading-tight font-bold text-[#1e3a8a]">
                  Engineering for Safety
                </h3>
              </div>
              <p className="text-center text-xl leading-relaxed text-slate-700">
                Engineering and safe road design plays a significant part in
                helping reduce the risk and severity of impaired driving
                crashes. The Florida Department of Transportation’s engineering
                strategies focus on creating safer systems that account for
                human error. Clearly posted speed limits, improved signage,
                enhanced lighting, and roadway features such as reduced speed
                zones all help drivers make safer decisions. These tactics are
                important in areas with changing traffic patterns, varied
                weather conditions, or limited visibility.
              </p>
              <p className="text-center text-xl leading-relaxed text-slate-700">
                Additional engineering solutions, such as wrong way driving
                detection systems, help identify dangerous situations early and
                reduce crashes. These methods support the Safe by DESIGN
                principle by reducing opportunities for severe outcomes when
                driver impairment or error occurs.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex h-22 flex-col items-center justify-center">
                <h3 className="h-20 text-center text-3xl leading-tight font-bold text-[#1e3a8a]">
                  Enforcement and High
                  <br className="hidden md:block" /> Visibility Efforts
                </h3>
              </div>
              <p className="text-center text-xl leading-relaxed text-slate-700">
                Enforcement is a key component of impaired driving prevention.
                Law enforcement agencies across Florida use high visibility
                enforcement strategies to deter impaired driving and remove
                dangerous drivers from the road. These efforts include increased
                patrols, sobriety checks where permitted and coordinated
                enforcement waves.
              </p>
              <p className="text-center text-xl leading-relaxed text-slate-700">
                High visibility enforcement works alongside education and
                engineering to reinforce safe behavior. Drivers are reminded
                that impaired driving has real consequences and that Florida’s
                roads are actively monitored to protect everyone who uses them.
                Reporting suspected impaired or aggressive driving also plays an
                important role.
              </p>
            </div>
          </div>

          {/* Red Call to Action */}
          <div className="container mx-auto mb-8 px-6 text-center">
            <h3 className="scale-y-110 transform text-2xl font-black tracking-tighter text-[#d32f2f] uppercase md:text-4xl">
              IF YOU SEE A DANGEROUS DRIVER, CALL *FHP (*347) OR 911 IN AN
              EMERGENCY.
            </h3>
          </div>

          {/* Data Driven Education */}
          <div className="container mx-auto mb-16 flex max-w-4xl flex-col items-center gap-10 px-6 md:flex-row md:items-start">
            <div className="mx-auto shrink-0 md:mx-0">
              <img
                src="/Web Assets/Drive_Sober_300CMYK.jpg"
                alt="Drive Sober or Get Pulled Over"
                className="h-auto w-52"
              />
            </div>
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-3xl font-bold tracking-tight text-[#1e3a8a]">
                Data-Driven Education
              </h3>
              <p className="text-xl leading-snug text-slate-800">
                Drive Sober Florida is a resource for everyone who uses
                Florida’s roadways. Supported by a data-driven research approach
                to develop and provide impaired driving information and
                education, safety strategies, impaired driving data, and more.
                For additional information, visit{" "}
                <Link
                  href="https://DriveSoberFL.com"
                  className="text-slate-800 underline decoration-1 underline-offset-2 hover:text-[#1e3a8a]"
                >
                  DriveSoberFL.com
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Am I Okay To Drive Section */}
          <div className="mx-auto mb-12 w-full max-w-[95%] rounded-full bg-[#1c3e6f] px-6 py-16 text-center text-white shadow-xl">
            <h2 className="mb-6 text-2xl leading-none font-black tracking-tight uppercase italic md:text-5xl">
              “AM I OKAY TO DRIVE?”
            </h2>
            <p className="mb-2 text-xl font-light tracking-wide uppercase md:text-2xl">
              IF YOU HAVE CONSUMED ANY ALCOHOL OR DRUGS, THE ANSWER IS NO.
            </p>
            <p className="text-xl leading-tight font-light tracking-wide uppercase md:text-2xl">
              REMEMBER, A PERSON’S JUDGEMENT IS THE FIRST THING AFFECTED BY
              IMPAIRMENT.
            </p>
          </div>

          {/* Safety Footer Text */}
          <div className="container mx-auto max-w-6xl space-y-6 px-6 text-center text-xl font-medium text-slate-800">
            <p>
              Safety remains a top priority for the Florida Department of
              Transportation. We encourage drivers to make the responsible
              choice every time they get behind the wheel: Drive Sober.
            </p>
            <p>
              Start the conversation in your community today - encourage family
              and friends to be safe and accountable on the road by driving
              sober.
            </p>
            <p className="pt-4 text-2xl font-bold">
              Let’s get everyone home safely!
            </p>
          </div>
          {/* Divider Line */}
          <div className="container w-full">
            <img
              src="/Web%20Assets/Divider%20Line.png"
              alt="Divider"
              className="h-28 w-full object-cover"
            />
          </div>
        </section>

        {/* Awareness & Prevention Section */}
        <section className="container max-w-7xl mx-auto mb-16 grid gap-12 px-10 md:grid-cols-5 lg:gap-20">
          <div className="col-span-2 space-y-6">
            <h3 className="text-3xl leading-tight font-bold text-[#1c3e6f]">
              Awareness Matters
            </h3>
            <p className="text-xl leading-relaxed text-slate-700 ml-3">
              The data tells a powerful story. Florida’s Strategic Highway
              Safety Plan shows that one in four traffic fatalities involves a
              driver impaired by alcohol or drugs. National Highway Traffic
              Safety Administration (NHTSA) data underscores the severity of
              this issue, with December 2022, ranking among the highest months
              for drunk-driving deaths in the past 15 years.
            </p>
            <p className="text-xl leading-relaxed text-slate-700 ml-3">
              Drug-impaired driving is equally dangerous and illegal in all 50
              states. A recent national study found that approximately one in
              four seriously injured drivers had active THC, the primary
              ingredient in marijuana, in their system.
            </p>
            <p className="text-xl leading-relaxed font-medium text-slate-700 ml-3">
              These crashes are not accidents. They are preventable.
            </p>
          </div>

          <div className="col-span-3 space-y-8">
            <div className="space-y-4">
              <h3 className="text-3xl leading-tight font-bold text-[#1c3e6f]">
                Substances that cause impairment can include:
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-xl text-slate-700 ml-3">
                <li>Alcohol</li>
                <li>Prescription drugs</li>
                <li>Over-the-counter medications</li>
                <li>Illegal drugs</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl leading-tight font-bold text-[#1c3e6f]">
                Plan ahead and choose safe alternatives:
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-xl leading-relaxed text-slate-700 ml-3">
                <li>Plan for a sober ride before heading out.</li>
                <li>Only drive if you are sober.</li>
                <li>
                  If you’re hosting a gathering, never let someone drive
                  impaired. Help them secure a safe, sober ride home.
                </li>
                <li>
                  <span className="font-semibold underline">Tow to Go</span>:
                  During the holiday season, AAA offers their free Tow to Go
                  program throughout Florida! Tow to Go provides a free and
                  confidential ride for impaired drivers and their vehicles who
                  do not have a safe alternative, within 10 miles. To arrange a
                  Tow to Go, call (855) 2-TOW-2-GO (855-286-9246).
                </li>
                <li>
                  If you see a suspected impaired driver, call *FHP (*347). For
                  emergencies, dial 911.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Area */}
        <footer className="mt-12 w-full bg-[#1c3e6f] py-12 text-white">
          <div className="container mx-auto space-y-8 px-6 text-center">
            {/* Title */}
            <h3 className="text-4xl font-medium tracking-tight text-blue-100">
              Additional Resources
            </h3>

            {/* Links */}
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xl leading-relaxed font-medium md:text-xl">
              <Link
                href="#"
                className="underline decoration-1 underline-offset-4 hover:text-blue-200"
              >
                FLHSMV Impaired Driving Campaign
              </Link>
              <span className="px-1 text-blue-300">|</span>
              <Link
                href="#"
                className="underline decoration-1 underline-offset-4 hover:text-blue-200"
              >
                Safety Office Impaired Driving Resources
              </Link>
              <span className="px-1 text-blue-300">|</span>
              <Link
                href="#"
                className="underline decoration-1 underline-offset-4 hover:text-blue-200"
              >
                National Highway Traffic Safety Administration: Drive Sober or
                Get Pulled Over
              </Link>
              <span className="px-1 text-blue-300">|</span>
              <Link
                href="#"
                className="underline decoration-1 underline-offset-4 hover:text-blue-200"
              >
                Florida Impaired Driving Coalition
              </Link>
              <span className="px-1 text-blue-300">|</span>
              <Link
                href="https://DriveSoberFL.com"
                className="underline decoration-1 underline-offset-4 hover:text-blue-200"
              >
                Drive Sober Florida
              </Link>
            </div>

            {/* FDOT Logo */}
            <div className="flex justify-center pt-8">
              <img
                src="/Web Assets/FDOT Logo_KO.png"
                alt="FDOT Logo"
                className="h-16 w-auto object-contain md:h-20"
              />
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
