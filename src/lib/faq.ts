export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What is the point of JustSendToMe?',
    answer:
      'The point of JustSendToMe is to provide a way for people to request files from other people without hassling the sender by requiring an account.',
  },
  {
    id: 'faq-2',
    question: 'How do credits work?',
    answer:
      'Credits are used to create request folders. You can pick longer expiration times for your folders but it costs more credits. Credits are not replenished every month. Instead they are recredited 30 days after they are used. So if you spend 1 credit today, you get 1 credit back 30 days from now.',
  },
  {
    id: 'faq-3',
    question: 'Do other people need an account to upload files?',
    answer:
      'No, anyone with the shareable link may upload files annonymously. Each folder has a maximum number of files and a maximum total size so share the link responsibly.',
  },
  {
    id: 'faq-4',
    question:
      'What if I need more credits or storage than the highest plan has?',
    answer:
      'If you would like to upgrade to a higher plan, please contact the support team. We will create a custom plan for you.',
  },
];
