import { Button } from './ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

export function Hero() {
  const scrollToDemo = () => {
    document.getElementById('summarizer')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-slate-50 to-red-50 opacity-50" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-24 sm:pb-32">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-slate-900">SynapseAI</span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-Powered Research Paper Summarization</span>
          </div>
          
          <h1 className="text-slate-900 mb-6">
            Summarize Research Papers
            <span className="block bg-gradient-to-r from-red-600 to-black bg-clip-text text-transparent">
              In Seconds
            </span>
          </h1>
          
          <p className="text-slate-600 mb-10 max-w-2xl mx-auto">
            A student project exploring AI and natural language processing. 
            Extract key findings and insights from academic papers using machine learning.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={scrollToDemo} className="bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-slate-900">
              Try It Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}