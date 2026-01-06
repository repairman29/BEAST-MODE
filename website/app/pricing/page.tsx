import PricingSection from '../../components/beast-mode/PricingSection';

export const metadata = {
  title: 'BEAST MODE - Pricing',
  description: 'Simple, transparent pricing for BEAST MODE. Start free and scale as you grow.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="pt-24 pb-16">
        <PricingSection />
      </div>
    </div>
  );
}

