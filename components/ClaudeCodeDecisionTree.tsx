'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, RefreshCw, Code, Zap, Brain, Link2, FileText, Settings, CheckCircle, Info, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
      when: 'Ideal for repetitive workflows that need consistent execution',
      examples: [
        { scenario: 'Code review automation', code: '/dev:code-review - Full analysis with actionable insights' },
        { scenario: 'Test generation', code: '/test:generate-test-cases - Creates comprehensive test suites' },
        { scenario: 'Release preparation', code: '/deploy:prepare-release - Automates changelog and versioning' }
      ],
      implementation: `# .claude/commands/my-command.md
---
argument-hint: "<type>: <description>"
---

Your command content here.
User arguments are available in: $ARGUMENTS

# Namespacing example:
# .claude/commands/frontend/component.md
# Usage: /frontend:component Button`
    },
    'subagent': {
      name: 'Subagent',
      icon: Brain,
      color: 'bg-purple-500',
      description: 'Specialized AI instances for complex domain-specific tasks',
      when: 'Best for complex analysis requiring expertise or parallel processing',
      examples: [
        { scenario: 'Parallel codebase exploration', code: '4 agents explore different directories simultaneously' },
        { scenario: 'Microservices team', code: 'service-architect + security-engineer + infra-specialist' },
        { scenario: 'Full-stack review', code: 'backend-architect + frontend-expert + database-optimizer' }
      ],
      implementation: `# .claude/agents/specialist.md
---
name: my-specialist
description: Expert in specific domain. Use PROACTIVELY for complex analysis.
tools: Read, Grep, Glob, Bash  # Optional - inherits all if omitted
---

You are a specialist in [domain]. Focus on:
- Key expertise area 1
- Key expertise area 2

# Tips: 
# - Use /agents command for interactive setup
# - Agents run in parallel (up to ~10 concurrent)`
    },
    'hook': {
      name: 'Hook',
      icon: Zap,
      color: 'bg-green-500',
      description: 'Automated scripts that run at specific lifecycle points',
      when: 'Ideal for enforcing rules and automated quality control',
      examples: [
        { scenario: 'Language-specific formatting', code: 'PostToolUse runs black for .py, prettier for .js' },
        { scenario: 'Dangerous command blocking', code: 'PreToolUse prevents rm -rf and chmod 777' },
        { scenario: 'Command logging', code: 'Track all bash commands with descriptions' }
      ],
      implementation: `// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      "formatter-command",
      { "command": "test-runner", "timeout": 5000 }
    ],
    "PreToolUse": ["security-check.sh"],
    "UserPromptSubmit": ["add-context.py"],
    "Stop": ["cleanup.sh"],
    "SubagentStop": ["log-subagent.sh"]
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
        { scenario: 'PR management', code: 'GitHub MCP - fetch status, create issues, approve PRs' },
        { scenario: 'Database operations', code: 'PostgreSQL MCP with secure connection strings' },
        { scenario: 'Business tools', code: 'Slack, Linear, Adobe Commerce integrations' }
      ],
      implementation: `// ~/Library/Application Support/Claude/claude_desktop_config.json
// Windows: %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token" }
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

## Commands
- \`pnpm dev\` - Start development
- \`pnpm test\` - Run tests

## Architecture
- Frontend: React + Zustand  
- Backend: Express + Prisma

## External Docs
@docs/api.md - API documentation
@README.md - Project overview`
    },
    'settings': {
      name: 'Settings',
      icon: Settings,
      color: 'bg-gray-500',
      description: 'Global configuration for tools, models, and environment',
      when: 'Configure system-wide behavior and restrictions',
      examples: [
        { scenario: 'Multi-environment config', code: 'Dev/prod settings with different endpoints' },
        { scenario: 'Auto-approval patterns', code: 'Safe commands and test files auto-approved' },
        { scenario: 'Project-specific MCP', code: 'Different MCP servers per project' }
      ],
      implementation: `// .claude/settings.json
{
  "allowedTools": [
    "bash_command",
    "read_file",
    "list_directory",
    "search_grep"
  ],
  "ignorePatterns": ["node_modules/", "*.log", ".git/"],
  "hooks": {
    // Hook configuration here
  }
}

# Use /permissions command for interactive tool management`
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Claude Code Decision Tree</h1>
          <p className="text-lg text-muted-foreground">Find the right customization feature for your needs</p>
        </div>

        {/* Progress Bar */}
        {!recommendation && (
          <div className="mb-8">
            <Progress value={((currentStep + 1) / questions.length) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {currentStep + 1} of {questions.length}
            </p>
          </div>
        )}

        {/* Question Card */}
        {!recommendation ? (
          <Card className="animate-fadeIn">
            <CardHeader>
              <CardTitle>{questions[currentStep].question}</CardTitle>
            </CardHeader>
            <CardContent>
            
            <div className="space-y-3">
              {questions[currentStep].options.map((option) => {
                const Icon = 'icon' in option ? option.icon : null;
                return (
                  <Button
                    key={option.value}
                    onClick={() => handleAnswer(questions[currentStep].id, option.value)}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:bg-accent"
                  >
                    <div className="flex items-start">
                      {Icon && (
                        <Icon className="w-6 h-6 text-muted-foreground mr-3 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium text-foreground">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground mt-1">{option.description}</div>
                        )}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>

            {currentStep > 0 && (
              <Button
                onClick={handleBack}
                variant="ghost"
                className="mt-6"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            </CardContent>
          </Card>
        ) : (
          /* Recommendation Card */
          <div className="space-y-6 animate-fadeIn">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  Recommended Features
                </CardTitle>
              </CardHeader>
              <CardContent>
              
              {recommendation.map((rec, index) => {
                const feature = features[rec.feature as keyof typeof features];
                const Icon = feature.icon;
                
                return (
                  <div key={rec.feature} className={cn(index > 0 && 'mt-6 pt-6 border-t')}>
                    <div className="flex items-start">
                      <div className={cn(feature.color, 'p-3 rounded-lg')}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h3 className="text-xl font-semibold">{feature.name}</h3>
                          <Badge variant="secondary" className="ml-3">
                            {rec.confidence}% match
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{feature.description}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Why:</strong> {rec.reason}
                        </p>
                        
                        {/* Examples */}
                        <div className="mt-4">
                          <h4 className="font-medium text-foreground mb-2">Common Use Cases:</h4>
                          <div className="space-y-2">
                            {feature.examples.map((example, i) => (
                              <div key={i} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full mr-2" />
                                <span className="text-muted-foreground">{example.scenario}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Implementation */}
                        <div className="mt-4">
                          <h4 className="font-medium text-foreground mb-2">Quick Start:</h4>
                          <div className="relative">
                            <pre className="bg-muted text-foreground p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{feature.implementation}</code>
                            </pre>
                            <Button
                              onClick={() => copyToClipboard(feature.implementation, rec.feature)}
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              title="Copy to clipboard"
                            >
                              {copiedCode === rec.feature ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </CardContent>
            </Card>

            {/* Additional Resources */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription>
                <ul className="space-y-2 mt-2">
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
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Explore built-in commands: /agents, /permissions, /vim, /status</span>
                </li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRestart}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Start Over
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Based on Claude Code documentation and best practices</p>
        </div>
      </div>
    </div>
  );
};

export default ClaudeCodeDecisionTree;