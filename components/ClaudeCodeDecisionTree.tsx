'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw, Code, Zap, Brain, Link2, FileText, Settings, CheckCircle, Info, Copy, ExternalLink } from 'lucide-react';

const ClaudeCodeDecisionTree = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Array<{questionId: string, value: string}>>([]);
  const [recommendation, setRecommendation] = useState<Array<{feature: string, confidence: number, reason: string}> | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const questions = [
    {
      id: 'task-type',
      question: 'What type of task do you need to accomplish?',
      options: [
        { value: 'repetitive', label: 'Repetitive workflow', icon: RefreshCw, description: 'Tasks you do multiple times with slight variations' },
        { value: 'complex', label: 'Complex analysis', icon: Brain, description: 'Multi-faceted problems requiring expertise' },
        { value: 'automated', label: 'Automated behavior', icon: Zap, description: 'Actions that should happen automatically' },
        { value: 'external', label: 'External integration', icon: Link2, description: 'Connect to APIs, databases, or tools' },
        { value: 'context', label: 'Project guidelines', icon: FileText, description: 'Standards and patterns to remember' },
        { value: 'config', label: 'System configuration', icon: Settings, description: 'Tool restrictions or environment setup' }
      ]
    },
    {
      id: 'frequency',
      question: 'How often will this be used?',
      options: [
        { value: 'multiple-daily', label: 'Multiple times per day', description: 'Core part of your workflow' },
        { value: 'daily', label: 'Daily', description: 'Regular but not constant' },
        { value: 'weekly', label: 'Weekly or less', description: 'Occasional use' },
        { value: 'always', label: 'Always active', description: 'Continuous background operation' }
      ] as const
    },
    {
      id: 'complexity',
      question: 'How complex is the logic?',
      options: [
        { value: 'simple', label: 'Simple & deterministic', description: 'Clear rules, predictable outcome' },
        { value: 'moderate', label: 'Moderate complexity', description: 'Some decision making required' },
        { value: 'complex', label: 'Complex analysis', description: 'Requires expertise or investigation' },
        { value: 'parallel', label: 'Multiple perspectives', description: 'Benefits from parallel processing' }
      ]
    },
    {
      id: 'trigger',
      question: 'How should it be triggered?',
      options: [
        { value: 'manual', label: 'Manual command', description: 'User explicitly triggers it' },
        { value: 'automatic', label: 'Automatic', description: 'Triggered by events or conditions' },
        { value: 'contextual', label: 'Context-aware', description: 'Claude decides when to use it' },
        { value: 'persistent', label: 'Always considered', description: 'Part of every interaction' }
      ]
    }
  ];

  const features = {
    'slash-command': {
      name: 'Slash Command',
      icon: Code,
      color: 'bg-blue-500',
      description: 'Reusable prompt templates for repetitive workflows',
      when: 'Perfect for standardized tasks with parameters',
      examples: [
        { scenario: 'Creating conventional commits', code: '/commit feat: add user authentication' },
        { scenario: 'Scaffolding components', code: '/component UserProfile' },
        { scenario: 'Running test suites', code: '/test unit' }
      ],
      implementation: `# .claude/commands/my-command.md
---
description: Description of your command
argument-hint: <parameter>
---
Task instructions using $ARGUMENTS placeholder`
    },
    'subagent': {
      name: 'Subagent',
      icon: Brain,
      color: 'bg-purple-500',
      description: 'Specialized AI instances for complex domain-specific tasks',
      when: 'Best for complex analysis requiring expertise or parallel processing',
      examples: [
        { scenario: 'Architecture analysis', code: 'Deploy architecture-analyzer agent' },
        { scenario: 'Security auditing', code: 'Use security-expert for vulnerability scan' },
        { scenario: 'Performance optimization', code: 'Invoke performance-engineer agent' }
      ],
      implementation: `# .claude/agents/specialist.md
---
name: my-specialist
description: Expert in specific domain
---
You are a specialist in...`
    },
    'hook': {
      name: 'Hook',
      icon: Zap,
      color: 'bg-green-500',
      description: 'Automated scripts that run at specific lifecycle points',
      when: 'Ideal for enforcing rules and automated quality control',
      examples: [
        { scenario: 'Auto-format on save', code: 'PostToolUse hook runs formatter' },
        { scenario: 'Security blocking', code: 'PreToolUse prevents sensitive access' },
        { scenario: 'Test on changes', code: 'PostToolUse triggers test suite' }
      ],
      implementation: `// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit",
      "hooks": [{
        "type": "command",
        "command": "your-command-here"
      }]
    }]
  }
}`
    },
    'mcp': {
      name: 'MCP',
      icon: Link2,
      color: 'bg-orange-500',
      description: 'Model Context Protocol for external integrations',
      when: 'Required for connecting to external tools and data sources',
      examples: [
        { scenario: 'Database queries', code: 'Connect to PostgreSQL for live data' },
        { scenario: 'API integration', code: 'Access Jira tickets directly' },
        { scenario: 'Tool automation', code: 'Control browser for testing' }
      ],
      implementation: `// Configure MCP server in Claude Desktop settings
{
  "mcpServers": {
    "my-integration": {
      "command": "npx",
      "args": ["@your/mcp-server"]
    }
  }
}`
    },
    'claude-md': {
      name: 'CLAUDE.md',
      icon: FileText,
      color: 'bg-indigo-500',
      description: 'Persistent memory for project context and guidelines',
      when: 'Use for coding standards, architecture decisions, and team conventions',
      examples: [
        { scenario: 'Coding standards', code: 'TypeScript strict mode, functional React' },
        { scenario: 'Architecture patterns', code: 'Microservices with event sourcing' },
        { scenario: 'Team conventions', code: 'PR template, commit format' }
      ],
      implementation: `# CLAUDE.md
## Project Standards
- Use TypeScript strict mode
- Prefer functional components
- Follow SOLID principles

## Architecture
- Frontend: React + Zustand
- Backend: Express + Prisma`
    },
    'settings': {
      name: 'Settings',
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Global configuration for tools, models, and environment',
      when: 'Configure system-wide behavior and restrictions',
      examples: [
        { scenario: 'Tool restrictions', code: 'Disable WebSearch for security' },
        { scenario: 'Model selection', code: 'Use specific Claude model' },
        { scenario: 'Environment vars', code: 'Set API keys and configs' }
      ],
      implementation: `// .claude/settings.json
{
  "model": "claude-3-5-sonnet-latest",
  "disallowedTools": ["WebSearch"],
  "env": {
    "API_KEY": "your-key-here"
  }
}`
    }
  };

  const getRecommendation = () => {
    const taskType = answers.find(a => a.questionId === 'task-type')?.value;
    const frequency = answers.find(a => a.questionId === 'frequency')?.value;
    const complexity = answers.find(a => a.questionId === 'complexity')?.value;
    const trigger = answers.find(a => a.questionId === 'trigger')?.value;

    const recommendations: Array<{feature: string, confidence: number, reason: string}> = [];

    // Primary recommendation based on task type
    if (taskType === 'repetitive') {
      recommendations.push({ feature: 'slash-command', confidence: 95, reason: 'Perfect for repetitive workflows with parameters' });
    } else if (taskType === 'complex') {
      recommendations.push({ feature: 'subagent', confidence: 90, reason: 'Ideal for complex analysis requiring expertise' });
    } else if (taskType === 'automated') {
      recommendations.push({ feature: 'hook', confidence: 95, reason: 'Automatic enforcement and quality control' });
    } else if (taskType === 'external') {
      recommendations.push({ feature: 'mcp', confidence: 100, reason: 'Required for external integrations' });
    } else if (taskType === 'context') {
      recommendations.push({ feature: 'claude-md', confidence: 100, reason: 'Best for persistent project context' });
    } else if (taskType === 'config') {
      recommendations.push({ feature: 'settings', confidence: 100, reason: 'System-wide configuration' });
    }

    // Secondary recommendations based on other factors
    if (complexity === 'parallel' && !recommendations.find(r => r.feature === 'subagent')) {
      recommendations.push({ feature: 'subagent', confidence: 80, reason: 'Multiple agents can work in parallel' });
    }

    if (trigger === 'automatic' && !recommendations.find(r => r.feature === 'hook')) {
      recommendations.push({ feature: 'hook', confidence: 85, reason: 'Hooks provide automatic triggering' });
    }

    if (frequency === 'always' && !recommendations.find(r => r.feature === 'claude-md')) {
      recommendations.push({ feature: 'claude-md', confidence: 70, reason: 'Always-active context awareness' });
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations;
  };

  const handleAnswer = (questionId: string, value: string) => {
    const newAnswers = [...answers.filter(a => a.questionId !== questionId), { questionId, value }];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate recommendation
      const recs = getRecommendation();
      setRecommendation(recs);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setRecommendation(null);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setRecommendation(null);
    setShowExamples(false);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    if (answers.length === questions.length && !recommendation) {
      const recs = getRecommendation();
      setRecommendation(recs);
    }
  }, [answers, recommendation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Claude Code Decision Tree</h1>
          <p className="text-lg text-gray-400">Find the right customization feature for your needs</p>
        </div>

        {/* Progress Bar */}
        {!recommendation && (
          <div className="mb-8">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2 text-center">
              Step {currentStep + 1} of {questions.length}
            </p>
          </div>
        )}

        {/* Question Card */}
        {!recommendation ? (
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 animate-fadeIn">
            <h2 className="text-2xl font-semibold mb-6">{questions[currentStep].question}</h2>
            
            <div className="space-y-3">
              {questions[currentStep].options.map((option) => {
                const Icon = 'icon' in option ? option.icon : null;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(questions[currentStep].id, option.value)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-700 transition-all group"
                  >
                    <div className="flex items-start">
                      {Icon && (
                        <Icon className="w-6 h-6 text-gray-500 group-hover:text-blue-400 mr-3 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium text-gray-100 group-hover:text-blue-400">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-gray-400 mt-1">{option.description}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="mt-6 flex items-center text-gray-400 hover:text-gray-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>
        ) : (
          /* Recommendation Card */
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                Recommended Features
              </h2>
              
              {recommendation.map((rec, index) => {
                const feature = features[rec.feature as keyof typeof features];
                const Icon = feature.icon;
                
                return (
                  <div key={rec.feature} className={`${index > 0 ? 'mt-6 pt-6 border-t border-gray-700' : ''}`}>
                    <div className="flex items-start">
                      <div className={`${feature.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h3 className="text-xl font-semibold">{feature.name}</h3>
                          <span className="ml-3 px-3 py-1 bg-green-900/30 text-green-400 text-sm rounded-full">
                            {rec.confidence}% match
                          </span>
                        </div>
                        <p className="text-gray-300 mt-1">{feature.description}</p>
                        <p className="text-sm text-gray-400 mt-2">
                          <strong>Why:</strong> {rec.reason}
                        </p>
                        
                        {/* Examples */}
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-200 mb-2">Common Use Cases:</h4>
                          <div className="space-y-2">
                            {feature.examples.map((example, i) => (
                              <div key={i} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
                                <span className="text-gray-300">{example.scenario}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Implementation */}
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-200 mb-2">Quick Start:</h4>
                          <div className="relative">
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{feature.implementation}</code>
                            </pre>
                            <button
                              onClick={() => copyToClipboard(feature.implementation, rec.feature)}
                              className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
                              title="Copy to clipboard"
                            >
                              {copiedCode === rec.feature ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Resources */}
            <div className="bg-blue-900/20 rounded-xl p-6">
              <h3 className="font-semibold text-blue-300 mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Next Steps
              </h3>
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Create the appropriate configuration files in your project</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Test your customization with a simple example first</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Combine multiple features for more sophisticated workflows</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Share successful customizations with your team</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Over
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Based on Claude Code documentation and best practices</p>
        </div>
      </div>
    </div>
  );
};

export default ClaudeCodeDecisionTree;