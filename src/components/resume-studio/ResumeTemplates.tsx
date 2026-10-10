import React from 'react';
import { ResumeContent, ResumeTemplateId } from '../../types/database';
import { ExternalLink, Github, Globe } from 'lucide-react';

export interface ResumeTemplateProps {
  content: ResumeContent;
  templateId: ResumeTemplateId;
}

export const ResumeTemplates: React.FC<ResumeTemplateProps> = ({
  content,
  templateId,
}) => {
  const { contactInfo, summary, skills, experience, projects, education, certifications, achievements } = content;

  // ==========================================================================
  // TEMPLATE 1: CLASSIC ATS (Single-column, high scannability, restrained styling)
  // ==========================================================================
  if (templateId === 'classic-ats') {
    return (
      <div className="resume-document bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-[800px] mx-auto min-h-[1050px] shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none">
        {/* Header */}
        <header className="border-b border-slate-900 pb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
            {contactInfo.fullName || 'Candidate Name'}
          </h1>
          {contactInfo.headline && (
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-700 mt-1">
              {contactInfo.headline}
            </div>
          )}
          <div className="text-[11px] text-slate-600 mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {contactInfo.location && <span>{contactInfo.location}</span>}
            {contactInfo.email && <span>{contactInfo.email}</span>}
            {contactInfo.phone && <span>{contactInfo.phone}</span>}
            {contactInfo.githubUrl && <span>GitHub: {contactInfo.githubUrl.replace(/^https?:\/\//, '')}</span>}
            {contactInfo.portfolioUrl && <span>Portfolio: {contactInfo.portfolioUrl.replace(/^https?:\/\//, '')}</span>}
          </div>
        </header>

        {/* Professional Summary */}
        {summary && (
          <section className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-slate-900">
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-slate-800 text-justify">
              {summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-slate-900">
              Technical Competencies
            </h2>
            <div className="text-xs space-y-1">
              {skills.map((group) => (
                <div key={group.id} className="flex flex-col sm:flex-row gap-1">
                  <span className="font-bold text-slate-900 min-w-[140px] shrink-0">
                    {group.category}:
                  </span>
                  <span className="text-slate-700">
                    {group.skills.join(', ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-slate-900">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="text-xs">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-slate-900">{exp.roleTitle}</span>
                    <span className="text-slate-600 font-normal tabular-nums">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-slate-700 italic mb-1">
                    <span>{exp.organization}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  <ul className="list-disc list-outside pl-4 space-y-1 text-slate-800 leading-relaxed">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-slate-900">
              Technical Projects & Artifacts
            </h2>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="text-xs">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-slate-900">
                      {proj.title}
                      {proj.technologies?.length > 0 && (
                        <span className="font-normal text-slate-600 italic ml-2">
                          ({proj.technologies.join(', ')})
                        </span>
                      )}
                    </span>
                    {proj.repoUrl && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        {proj.repoUrl.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800 mt-1 leading-relaxed">
                    {proj.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-slate-300 pb-1 mb-2 text-slate-900">
              Education
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="text-xs flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree}</span>
                    <span className="text-slate-700"> in {edu.fieldOfStudy}</span>
                    <div className="text-slate-600 italic">{edu.institution}</div>
                  </div>
                  <div className="text-slate-600 tabular-nums shrink-0">
                    {edu.startDate} – {edu.endDate || 'Present'}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ==========================================================================
  // TEMPLATE 2: MODERN PROFESSIONAL (Refined typography, subtle accent dividers)
  // ==========================================================================
  if (templateId === 'modern-pro') {
    return (
      <div className="resume-document bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-[800px] mx-auto min-h-[1050px] shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none">
        {/* Header */}
        <header className="pb-6 border-b border-indigo-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {contactInfo.fullName || 'Candidate Name'}
            </h1>
            <p className="text-sm font-semibold text-indigo-600 mt-1">
              {contactInfo.headline || 'Software Engineering Professional'}
            </p>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5 md:text-right font-medium">
            {contactInfo.location && <div>{contactInfo.location}</div>}
            {contactInfo.email && <div className="text-slate-800">{contactInfo.email}</div>}
            {contactInfo.githubUrl && <div className="text-indigo-600">{contactInfo.githubUrl.replace(/^https?:\/\//, '')}</div>}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Executive Profile
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed pl-4 border-l-2 border-indigo-200">
              {summary}
            </p>
          </section>
        )}

        {/* Skills Bar */}
        {skills.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Core Competencies
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
              {skills.map((group) => (
                <div key={group.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1">{group.category}</span>
                  <span className="text-slate-600">{group.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Experience & Impact
            </h2>
            <div className="space-y-5 pl-4">
              {experience.map((exp) => (
                <div key={exp.id} className="text-xs">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-sm font-bold text-slate-900">{exp.roleTitle}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 mb-2">
                    {exp.organization} {exp.location && `· ${exp.location}`}
                  </div>
                  <ul className="space-y-1.5 text-slate-600 pl-3">
                    {exp.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 font-bold">›</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Key Software Artifacts
            </h2>
            <div className="space-y-4 pl-4">
              {projects.map((proj) => (
                <div key={proj.id} className="text-xs bg-slate-50/60 p-3.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-slate-900 font-bold">{proj.title}</span>
                    {proj.repoUrl && (
                      <span className="text-indigo-600 font-mono text-[10px]">
                        {proj.repoUrl.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                  {proj.technologies?.length > 0 && (
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Stack: {proj.technologies.join(', ')}
                    </div>
                  )}
                  <ul className="mt-2 space-y-1 text-slate-600">
                    {proj.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-slate-400">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Education
            </h2>
            <div className="space-y-2 pl-4 text-xs">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900">{edu.institution}</span>
                    <span className="text-slate-600 block">{edu.degree} in {edu.fieldOfStudy}</span>
                  </div>
                  <span className="font-mono text-slate-400">{edu.startDate} – {edu.endDate || 'Present'}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ==========================================================================
  // TEMPLATE 3: TECHNICAL PORTFOLIO (Engineered for builders & open-source proof)
  // ==========================================================================
  return (
    <div className="resume-document bg-white text-slate-900 p-8 sm:p-12 font-sans max-w-[800px] mx-auto min-h-[1050px] shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none">
      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {contactInfo.fullName || 'Candidate Name'}
          </h1>
          <span className="font-mono text-xs uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Systems & Code Execution
          </span>
        </div>
        <p className="text-xs font-mono font-medium text-slate-700 mt-1">
          {contactInfo.headline || 'Full-Stack & Systems Engineer'}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-600">
          {contactInfo.email && <span>{contactInfo.email}</span>}
          {contactInfo.location && <span>{contactInfo.location}</span>}
          {contactInfo.githubUrl && <span>github/{contactInfo.githubUrl.split('/').pop()}</span>}
          {contactInfo.portfolioUrl && <span>portfolio: {contactInfo.portfolioUrl.replace(/^https?:\/\//, '')}</span>}
        </div>
      </header>

      {/* Systems Summary */}
      {summary && (
        <section className="mt-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            // Engineering Overview
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed font-sans">
            {summary}
          </p>
        </section>
      )}

      {/* Technical Projects & Code Evidence */}
      {projects.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            // Verified Technical Projects & Architecture
          </h2>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id} className="text-xs p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-sm text-slate-900">{proj.title}</h3>
                  {proj.repoUrl && (
                    <span className="font-mono text-[10px] text-indigo-600">
                      {proj.repoUrl.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                {proj.technologies?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {proj.technologies.map((t, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[9px] font-semibold text-slate-700">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <ul className="mt-2 space-y-1 text-slate-700 font-sans">
                  {proj.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">»</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills Matrix */}
      {skills.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            // Verified Competencies & Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {skills.map((group) => (
              <div key={group.id} className="p-2 border border-slate-100 rounded bg-slate-50/30">
                <span className="font-mono font-bold text-[11px] text-slate-900 block">{group.category}</span>
                <span className="text-slate-700">{group.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            // Work & Systems Experience
          </h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">{exp.roleTitle} @ {exp.organization}</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                  </span>
                </div>
                <ul className="mt-1 space-y-1 text-slate-700">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">›</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
            // Education & Foundation
          </h2>
          <div className="space-y-2 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree}</span>
                  <span className="text-slate-600"> · {edu.institution}</span>
                </div>
                <span className="font-mono text-slate-500">{edu.startDate} – {edu.endDate || 'Present'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
