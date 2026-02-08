"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What areas do you cover?",
    answer:
      "We provide services across the UK, with primary operations in the Midlands region. Contact us to discuss your specific requirements.",
  },
  {
    question: "How do I request a quote?",
    answer:
      "You can request a quote by filling out the contact form above, calling us directly, or emailing our team. We aim to respond within 24 hours.",
  },
  {
    question: "Are your drivers DBS checked?",
    answer:
      "Yes, all our drivers undergo enhanced DBS checks and receive regular safeguarding training to ensure the safety of all passengers.",
  },
  {
    question: "Do you provide wheelchair accessible vehicles?",
    answer:
      "Yes, our fleet includes a range of wheelchair accessible vehicles equipped with ramps, tail lifts, and secure restraint systems.",
  },
];

export function ContactFAQ() {
  return (
    <Accordion type="single" collapsible className="space-y-4">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`faq-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
