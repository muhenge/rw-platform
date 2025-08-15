'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket, Users, Clock, BarChart3 } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const features = [
    { icon: <Rocket className="h-6 w-6" />, title: "Project Management" },
    { icon: <Users className="h-6 w-6" />, title: "Team Collaboration" },
    { icon: <Clock className="h-6 w-6" />, title: "Time Tracking" },
    { icon: <BarChart3 className="h-6 w-6" />, title: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Rocket className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              HesedAdvocates
            </span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => router.push('/signin')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/signup')} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Modern Project Management
          <span className="block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mt-2">
            Made Simple
          </span>
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
          Streamline your workflow, collaborate with your team, and deliver projects on time.
        </p>

        <div className="flex flex-wrap justify-center gap-8 mt-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md w-64 transition-transform hover:scale-105">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of teams already managing their projects with HesedAdvocates.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-lg py-6 px-8"
            onClick={() => router.push('/signup')}
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
