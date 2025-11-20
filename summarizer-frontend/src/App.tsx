import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Demo } from './components/Demo';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Hero />
      <Features />
      <Demo />
      <HowItWorks />
      <Footer />
    </div>
  );
}
