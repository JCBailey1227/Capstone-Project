import { Upload, Cpu, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Paper',
    description: 'Upload your research paper in PDF, DOC, or TXT format.'
  },
  {
    icon: Cpu,
    title: 'AI Analysis',
    description: 'Our AI analyzes the content, identifying key findings, methodology, and conclusions.'
  },
  {
    icon: Download,
    title: 'Get Summary',
    description: 'Receive a concise summary highlighting the essential points of the research.'
  }
];

export function HowItWorks() {
  return (
    <div id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-slate-900 mb-4">
            How It Works
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Three simple steps from research paper to summary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-red-200 via-slate-200 to-red-200" 
               style={{ top: '4rem', left: '20%', right: '20%' }} />
          
          {steps.map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center mb-6 relative z-10 shadow-lg">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute top-6 -right-2 w-8 h-8 bg-white rounded-full border-4 border-red-600 flex items-center justify-center z-20">
                  <span className="text-red-600">{index + 1}</span>
                </div>
                <h3 className="text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}