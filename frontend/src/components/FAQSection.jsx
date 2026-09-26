import React, { useState } from 'react';
import { faqs } from '../mockData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { MessageCircle } from 'lucide-react';

const FAQSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sky-500 text-sm font-semibold uppercase tracking-widest">Bantuan</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum seputar layanan Trans Koetaradja
          </p>
        </div>

        {/* Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-100 rounded-2xl px-6 bg-gray-50 hover:border-sky-200 transition-colors duration-200 data-[state=open]:bg-white data-[state=open]:border-sky-200 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-sky-600 py-5 text-sm md:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="mt-12 max-w-xl mx-auto text-center bg-slate-950 rounded-2xl p-8">
          <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-sky-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Masih ada pertanyaan?</h3>
          <p className="text-slate-400 text-sm mb-6">Tim kami siap membantu Anda setiap hari</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/628116712349"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200"
            >
              WhatsApp Kami
            </a>
            <a
              href="mailto:info@transkutaraja.acehprov.go.id"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold px-6 py-3 rounded-xl border border-white/10 transition-all duration-200"
            >
              Kirim Email
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQSection;
