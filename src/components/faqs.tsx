'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { FaqItem } from '@/lib/faq';

interface FAQsProps {
  faqItems: FaqItem[];
}

export default function FAQs({ faqItems }: FAQsProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-4xl font-semibold text-pretty lg:text-5xl">
          Frequently Asked Questions
        </h2>
        {/* <p className="text-muted-foreground mt-4 text-balance">
          Discover quick and comprehensive answers to common questions about our
          platform, services, and features.
        </p> */}
      </div>

      <div className="mx-auto mt-12 max-w-xl">
        <Accordion
          type="single"
          collapsible
          className="bg-card ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0"
        >
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-dashed"
            >
              <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-base">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-muted-foreground mt-6 px-8 text-center">
          Can't find what you're looking for?{' '}
          <a
            href="mailto:support@justsendto.me"
            className="text-primary font-medium hover:underline"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
