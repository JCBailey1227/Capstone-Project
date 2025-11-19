import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-white">SynapseAI</span>
            </div>
            <p className="text-slate-400 mb-4 max-w-md">
              An AI-powered research paper summarization tool created as a class project to demonstrate 
              natural language processing and machine learning concepts.
            </p>
          </div>

          {/* Project Info */}
          <div>
            <h4 className="text-white mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#summarizer" className="hover:text-white transition-colors">Summarizer</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-400">
            Student Project © 2025
          </p>
        </div>
      </div>
    </footer>
  );
}