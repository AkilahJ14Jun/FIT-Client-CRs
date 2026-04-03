import React, { useState } from 'react';
import {
  Users, Database, Package, BarChart3, Settings,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Lightbulb,
  MessageCircle, ArrowRight, Star, HelpCircle, Fish, Printer
} from 'lucide-react';

type GuideSection = 'start' | 'customers' | 'sources' | 'entries' | 'reports' | 'bills' | 'settings' | 'tips';
import { useTranslation } from '../i18n/TranslationProvider';

export const UserGuide: React.FC = () => {
  const { t } = useTranslation();
  const [section, setSection] = useState<GuideSection>('start');

  const SECTIONS: { id: GuideSection; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'start', labelKey: 'guide.section.start', icon: <Star size={15} /> },
    { id: 'customers', labelKey: 'guide.section.customers', icon: <Users size={15} /> },
    { id: 'sources', labelKey: 'guide.section.sources', icon: <Database size={15} /> },
    { id: 'entries', labelKey: 'guide.section.entries', icon: <Package size={15} /> },
    { id: 'reports', labelKey: 'guide.section.reports', icon: <BarChart3 size={15} /> },
    { id: 'bills', labelKey: 'guide.section.bills', icon: <MessageCircle size={15} /> },
    { id: 'settings', labelKey: 'guide.section.settings', icon: <Settings size={15} /> },
    { id: 'tips', labelKey: 'guide.section.tips', icon: <HelpCircle size={15} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Intro banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Fish size={24} className="text-cyan-300" />
          <h1 className="text-xl font-bold">{t('guide.intro.title')}</h1>
        </div>
        <p className="text-blue-200 text-sm">
          {t('guide.intro.desc')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar nav */}
        <div className="lg:w-48 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                  section === s.id
                    ? 'bg-blue-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.icon}
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Getting Started */}
          {section === 'start' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.start.whatIsFit')} icon={<Fish size={20} />} color="bg-blue-50 text-blue-800">
                <p className="text-sm text-gray-700 mb-3">
                  {t('guide.start.whatIsFit.p1')}
                </p>
                <p className="text-sm text-gray-700">
                  {t('guide.start.whatIsFit.p2')}
                </p>
              </ContentCard>

              <ContentCard title={t('guide.start.quickStart')} icon={<Star size={20} />} color="bg-yellow-50 text-yellow-700">
                <div className="space-y-3">
                  {[
                    { step: '1', title: t('guide.start.step1.title'), desc: t('guide.start.step1.desc') },
                    { step: '2', title: t('guide.start.step2.title'), desc: t('guide.start.step2.desc') },
                    { step: '3', title: t('guide.start.step3.title'), desc: t('guide.start.step3.desc') },
                    { step: '4', title: t('guide.start.step4.title'), desc: t('guide.start.step4.desc') },
                    { step: '5', title: t('guide.start.step5.title'), desc: t('guide.start.step5.desc') },
                  ].map(({ step, title, desc }) => (
                    <StepItem
                      key={step}
                      step={step}
                      title={title}
                      desc={desc}
                    />
                  ))}
                </div>
              </ContentCard>

              <ContentCard title={t('guide.start.dashboard.title')} icon={<BarChart3 size={20} />} color="bg-emerald-50 text-emerald-700">
                <p className="text-sm text-gray-700 mb-3">{t('guide.start.dashboard.summary')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: t('guide.start.dashboard.sent'), desc: t('guide.start.dashboard.sentDesc') },
                    { label: t('guide.start.dashboard.returned'), desc: t('guide.start.dashboard.returnedDesc') },
                    { label: t('guide.start.dashboard.balance'), desc: t('guide.start.dashboard.balanceDesc') },
                    { label: t('guide.start.dispatch'), desc: t('guide.start.dispatchDesc') },
                  ].map(({ label, desc }) => (
                    <div key={label} className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </ContentCard>
            </div>
          )}

          {/* Customers */}
          {section === 'customers' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.customers.title')} icon={<Users size={20} />} color="bg-purple-50 text-purple-700">
                <p className="text-sm text-gray-700 mb-4">
                  {t('guide.customers.intro')}
                </p>
                <StepList steps={[
                  { title: t('guide.customers.step1.title'), desc: t('guide.customers.step1.desc') },
                  { title: t('guide.customers.step2.title'), desc: t('guide.customers.step2.desc') },
                  { title: t('guide.customers.step3.title'), desc: t('guide.customers.step3.desc') },
                  { title: t('guide.customers.step4.title'), desc: t('guide.customers.step4.desc') },
                  { title: t('guide.customers.step5.title'), desc: t('guide.customers.step5.desc') },
                ]} />
              </ContentCard>
              <InfoBox type="tip" title={t('guide.customers.tip.title')}>
                {t('guide.customers.tip.content')}
              </InfoBox>
            </div>
          )}

          {/* Sources */}
          {section === 'sources' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.sources.title')} icon={<Database size={20} />} color="bg-emerald-50 text-emerald-700">
                <p className="text-sm text-gray-700 mb-4">{t('guide.sources.intro')}</p>
                <StepList steps={[
                  { title: t('guide.sources.step1.title'), desc: t('guide.sources.step1.desc') },
                  { title: t('guide.sources.step2.title'), desc: t('guide.sources.step2.desc') },
                  { title: t('guide.sources.step3.title'), desc: t('guide.sources.step3.desc') },
                ]} />
              </ContentCard>
              <InfoBox type="info" title={t('guide.sources.info.title')}>
                {t('guide.sources.info.content')}
              </InfoBox>
            </div>
          )}

          {/* Box Entries */}
          {section === 'entries' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.entries.recordTitle')} icon={<Package size={20} />} color="bg-orange-50 text-orange-700">
                <p className="text-sm text-gray-700 mb-4">{t('guide.entries.recordIntro')}</p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.entries.typesHeading')}</p>
                  <div className="space-y-2">
                    {[
                      { type: t('guide.entries.type.dispatch'), desc: t('guide.entries.type.dispatchDesc'), color: 'bg-blue-100 text-blue-800' },
                      { type: t('guide.entries.type.return'), desc: t('guide.entries.type.returnDesc'), color: 'bg-green-100 text-green-800' },
                      { type: t('guide.entries.type.opening'), desc: t('guide.entries.type.openingDesc'), color: 'bg-yellow-100 text-yellow-800' },
                      { type: t('guide.entries.type.forward'), desc: t('guide.entries.type.forwardDesc'), color: 'bg-orange-100 text-orange-800' },
                      { type: t('guide.entries.type.external'), desc: t('guide.entries.type.externalDesc'), color: 'bg-purple-100 text-purple-800' },
                    ].map(({ type, desc, color }) => (
                      <div key={type} className="flex items-start gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${color}`}>{type}</span>
                        <span className="text-xs text-gray-600">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.entries.formHeading')}</p>
                  <div className="space-y-1.5">
                    {[
                      { field: t('guide.entries.field.billNo'), desc: t('guide.entries.field.billNoDesc') },
                      { field: t('guide.entries.field.date'), desc: t('guide.entries.field.dateDesc') },
                      { field: t('guide.entries.field.customer'), desc: t('guide.entries.field.customerDesc') },
                      { field: t('guide.entries.field.entryType'), desc: t('guide.entries.field.entryTypeDesc') },
                      { field: t('guide.entries.field.totalSent'), desc: t('guide.entries.field.totalSentDesc') },
                      { field: t('guide.entries.field.currentQty'), desc: t('guide.entries.field.currentQtyDesc') },
                      { field: t('guide.entries.field.returned'), desc: t('guide.entries.field.returnedDesc') },
                      { field: t('guide.entries.field.balance'), desc: t('guide.entries.field.balanceDesc') },
                      { field: t('guide.entries.field.driver'), desc: t('guide.entries.field.driverDesc') },
                      { field: t('guide.entries.field.vehicle'), desc: t('guide.entries.field.vehicleDesc') },
                      { field: t('guide.entries.field.description'), desc: t('guide.entries.field.descriptionDesc') },
                      { field: t('guide.entries.field.extSource'), desc: t('guide.entries.field.extSourceDesc') },
                    ].map(({ field, desc }) => (
                      <div key={field} className="grid grid-cols-5 gap-2 text-xs">
                        <span className="col-span-2 font-semibold text-gray-700">{field}</span>
                        <span className="col-span-3 text-gray-600">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ContentCard>

              <ContentCard title={t('guide.entries.manageTitle')} icon={<Package size={20} />} color="bg-blue-50 text-blue-800">
                <p className="text-sm text-gray-700 mb-3">{t('guide.entries.manageDesc')}</p>
                <StepList steps={[
                  { title: t('guide.entries.mgt.search'), desc: t('guide.entries.mgt.searchDesc') },
                  { title: t('guide.entries.mgt.pdf'), desc: t('guide.entries.mgt.pdfDesc') },
                  { title: t('guide.entries.mgt.wa'), desc: t('guide.entries.mgt.waDesc') },
                  { title: t('guide.entries.mgt.edit'), desc: t('guide.entries.mgt.editDesc') },
                  { title: t('guide.entries.mgt.delete'), desc: t('guide.entries.mgt.deleteDesc') },
                ]} />
              </ContentCard>
              <InfoBox type="warning" title={t('guide.entries.warning.title')}>
                {t('guide.entries.warning.content')}
              </InfoBox>
            </div>
          )}

          {/* Reports */}
          {section === 'reports' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.reports.title')} icon={<BarChart3 size={20} />} color="bg-yellow-50 text-yellow-700">
                <p className="text-sm text-gray-700 mb-4">{t('guide.reports.intro')}</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.reports.typesHeading')}</p>
                    <div className="space-y-2">
                      {[
                        { name: t('guide.reports.type.all'), desc: t('guide.reports.type.allDesc') },
                        { name: t('guide.reports.type.one'), desc: t('guide.reports.type.oneDesc') },
                        { name: t('guide.reports.type.single'), desc: t('guide.reports.type.singleDesc') },
                      ].map(({ name, desc }) => (
                        <div key={name} className="bg-white border border-gray-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">{name}</p>
                          <p className="text-xs text-gray-600">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.reports.howHeading')}</p>
                    <StepList steps={[
                      { title: t('guide.reports.rpt.select'), desc: t('guide.reports.rpt.selectDesc') },
                      { title: t('guide.reports.rpt.customer'), desc: t('guide.reports.rpt.customerDesc') },
                      { title: t('guide.reports.rpt.date'), desc: t('guide.reports.rpt.dateDesc') },
                      { title: t('guide.reports.rpt.run'), desc: t('guide.reports.rpt.runDesc') },
                      { title: t('guide.reports.rpt.export'), desc: t('guide.reports.rpt.exportDesc') },
                    ]} />
                  </div>
                </div>
              </ContentCard>
              <InfoBox type="tip" title={t('guide.reports.tip.title')}>
                {t('guide.reports.tip.content')}
              </InfoBox>
            </div>
          )}

          {/* Bills & WhatsApp */}
          {section === 'bills' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.bills.title')} icon={<Printer size={20} />} color="bg-green-50 text-green-700">
                <p className="text-sm text-gray-700 mb-4">{t('guide.bills.intro')}</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.bills.pdfHeading')}</p>
                    <StepList steps={[
                      { title: t('guide.bills.pdf.1'), desc: t('guide.bills.pdf.1Desc') },
                      { title: t('guide.bills.pdf.2'), desc: t('guide.bills.pdf.2Desc') },
                      { title: t('guide.bills.pdf.3'), desc: t('guide.bills.pdf.3Desc') },
                    ]} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">{t('guide.bills.waHeading')}</p>
                    <StepList steps={[
                      { title: t('guide.bills.wa.1'), desc: t('guide.bills.wa.1Desc') },
                      { title: t('guide.bills.wa.2'), desc: t('guide.bills.wa.2Desc') },
                      { title: t('guide.bills.wa.3'), desc: t('guide.bills.wa.3Desc') },
                    ]} />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('guide.bills.pdfContents')}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        t('guide.bills.pdf.coName'),
                        t('guide.bills.pdf.billNo'),
                        t('guide.bills.pdf.custName'),
                        t('guide.bills.pdf.custAddr'),
                        t('guide.bills.pdf.driver'),
                        t('guide.bills.pdf.boxes'),
                        t('guide.bills.pdf.balance'),
                        t('guide.bills.pdf.extSrc'),
                        t('guide.bills.pdf.desc'),
                        t('guide.bills.pdf.layout'),
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ContentCard>
              <InfoBox type="tip" title={t('guide.bills.tip.title')}>
                {t('guide.bills.tip.content')}
              </InfoBox>
            </div>
          )}

          {/* Settings */}
          {section === 'settings' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.settings.title')} icon={<Settings size={20} />} color="bg-gray-100 text-gray-700">
                <p className="text-sm text-gray-700 mb-4">{t('guide.settings.intro')}</p>
                <div className="space-y-3">
                  {[
                    {
                      title: t('guide.settings.company'),
                      items: [
                        t('guide.settings.comp.name'),
                        t('guide.settings.comp.trader'),
                        t('guide.settings.comp.addr'),
                        t('guide.settings.comp.prefix'),
                        t('guide.settings.comp.save'),
                      ],
                    },
                    {
                      title: t('guide.settings.backup'),
                      items: [
                        t('guide.settings.bk.dl'),
                        t('guide.settings.bk.store'),
                        t('guide.settings.bk.restore'),
                        t('guide.settings.bk.daily'),
                        t('guide.settings.bk.clear'),
                      ],
                    },
                    {
                      title: t('guide.settings.audit'),
                      items: [
                        t('guide.settings.audit.shows'),
                        t('guide.settings.audit.auto'),
                        t('guide.settings.audit.useful'),
                      ],
                    },
                  ].map(({ title, items }) => (
                    <div key={title} className="border border-gray-100 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">{title}</p>
                      <ul className="space-y-1.5">
                        {items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
                            <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ContentCard>
              <InfoBox type="warning" title={t('guide.settings.warning.title')}>
                {t('guide.settings.warning.content')}
              </InfoBox>
            </div>
          )}

          {/* Tips & FAQ */}
          {section === 'tips' && (
            <div className="space-y-4">
              <ContentCard title={t('guide.tips.title')} icon={<HelpCircle size={20} />} color="bg-blue-50 text-blue-800">
                <div className="space-y-3">
                  {[
                    { q: t('guide.tips.q1'), a: t('guide.tips.a1') },
                    { q: t('guide.tips.q2'), a: t('guide.tips.a2') },
                    { q: t('guide.tips.q3'), a: t('guide.tips.a3') },
                    { q: t('guide.tips.q4'), a: t('guide.tips.a4') },
                    { q: t('guide.tips.q5'), a: t('guide.tips.a5') },
                    { q: t('guide.tips.q6'), a: t('guide.tips.a6') },
                    { q: t('guide.tips.q7'), a: t('guide.tips.a7') },
                    { q: t('guide.tips.q8'), a: t('guide.tips.a8') },
                  ].map(({ q, a }, i) => (
                    <FAQItem key={i} question={q} answer={a} />
                  ))}
                </div>
              </ContentCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helper Components ──────────────────────────────────────────────────

const StepItem: React.FC<{ step?: string; title: string; desc: string; icon?: React.ReactNode }> = ({ step, title, desc }) => (
  <div className="flex items-start gap-3">
    {step && (
      <div className="bg-blue-900 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">{step}</div>
    )}
    <div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="text-xs text-gray-600">{desc}</p>
    </div>
  </div>
);

const ContentCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ title, icon, color, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className={`rounded-xl p-2 ${color}`}>{icon}</div>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

const StepList: React.FC<{ steps: { title: string; desc: string }[] }> = ({ steps }) => (
  <div className="space-y-2">
    {steps.map(({ title, desc }, i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="bg-blue-50 text-blue-700 rounded-lg p-1.5 shrink-0 mt-0.5">
          <ArrowRight size={14} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-600">{desc}</p>
        </div>
      </div>
    ))}
  </div>
);

type InfoType = 'tip' | 'info' | 'warning';

const InfoBox: React.FC<{ type: InfoType; title: string; children: React.ReactNode }> = ({ type, title, children }) => {
  const styles: Record<InfoType, { bg: string; border: string; icon: React.ReactNode; titleColor: string }> = {
    tip: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Lightbulb size={16} />, titleColor: 'text-emerald-800' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: <AlertCircle size={16} />, titleColor: 'text-blue-800' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle size={16} />, titleColor: 'text-amber-800' },
  };
  const s = styles[type];
  return (
    <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
      <div className={`flex items-center gap-2 font-semibold text-sm mb-1 ${s.titleColor}`}>
        {s.icon} {title}
      </div>
      <p className="text-xs text-gray-700">{children}</p>
    </div>
  );
};

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-800">{question}</span>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-gray-600 bg-blue-50/30 border-t border-gray-100">
          <div className="pt-2">{answer}</div>
        </div>
      )}
    </div>
  );
};
