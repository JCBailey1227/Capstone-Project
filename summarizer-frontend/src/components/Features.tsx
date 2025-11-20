import { Zap, Shield, Globe, Brain, Clock, FileText } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast Processing',
    description: 'Quickly analyze research papers to extract key findings and conclusions.'
  },
  {
    icon: Brain,
    title: 'AI-Powered',
    description: 'Uses natural language processing to understand complex academic content and context.'
  },
  {
    icon: FileText,
    title: 'Academic Focus',
    description: 'Designed specifically for research papers, journal articles, and academic documents.'
  },
  {
    icon: Globe,
    title: 'Extract Key Points',
    description: 'Identifies methodology, results, and conclusions from research papers.'
  },
  {
    icon: Clock,
    title: 'Time-Saving',
    description: 'Review papers faster by getting concise summaries of lengthy research.'
  },
  {
    icon: Shield,
    title: 'Simple & Clean',
    description: 'Easy-to-use interface focused on delivering clear, academic summaries.'
  }
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-slate-900 mb-4">
            Project Features
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Demonstrating AI capabilities for academic research paper summarization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl border border-slate-200 hover:border-red-300 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-slate-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}