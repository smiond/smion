'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Suspense } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award,
  Globe,
  Download
} from 'lucide-react'

function CVContentInner() {
  const { t } = useTranslation()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
              <img 
                src="/profile.jpg" 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to User icon if image not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.className = 'w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center';
                    parent.innerHTML = '<svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                  }
                }}
              />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('cv.name')}
            </h1>
            <p className="text-xl text-gray-300 mb-6">{t('cv.title')}</p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">{t('cv.summary')}</p>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6 mb-8">
            <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-lg">
              <Mail className="w-5 h-5 text-blue-400" />
              <span>{t('cv.email')}</span>
            </div>
            <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-lg">
              <Phone className="w-5 h-5 text-blue-400" />
              <span>{t('cv.phone')}</span>
            </div>
            <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span>{t('cv.location')}</span>
            </div>
            <div className="flex items-center space-x-2 glass-effect px-4 py-2 rounded-lg">
              <Globe className="w-5 h-5 text-blue-400" />
              <span>{t('cv.website')}</span>
            </div>
          </motion.div>

          {/* Download CV Button */}
          <motion.div variants={itemVariants}>
            <a href="/cv/smion-cv.pdf" download className="btn-primary flex items-center space-x-2 mx-auto">
              <Download className="w-5 h-5" />
              <span>{t('cv.download')}</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Left Column */}
          <div className="space-y-8">
            {/* Experience */}
            <motion.div variants={itemVariants} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Briefcase className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">{t('cv.experience.title')}</h2>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="border-l-2 border-blue-500 pl-4">
                    <h3 className="text-lg font-semibold">{t(`cv.experience.job${item}.title`)}</h3>
                    <p className="text-blue-400 font-medium">{t(`cv.experience.job${item}.company`)}</p>
                    <p className="text-gray-400 text-sm mb-2">{t(`cv.experience.job${item}.period`)}</p>
                    <p className="text-gray-300">{t(`cv.experience.job${item}.description`)}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Education */}
            <motion.div variants={itemVariants} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">{t('cv.education.title')}</h2>
              </div>
              <div className="space-y-4">
                {[1, 2].map((item) => (
                  <div key={item} className="border-l-2 border-purple-500 pl-4">
                    <h3 className="text-lg font-semibold">{t(`cv.education.degree${item}.title`)}</h3>
                    <p className="text-purple-400 font-medium">{t(`cv.education.degree${item}.institution`)}</p>
                    <p className="text-gray-400 text-sm">{t(`cv.education.degree${item}.period`)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Skills */}
            <motion.div variants={itemVariants} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Code className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">{t('cv.skills.title')}</h2>
              </div>
              <div className="space-y-4">
                {['technical', 'languages', 'tools'].map((category) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3">{t(`cv.skills.${category}.title`)}</h3>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full text-sm"
                        >
                          {t(`cv.skills.${category}.skill${skill}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div variants={itemVariants} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center space-x-3 mb-6">
                <Award className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold">{t('cv.certifications.title')}</h2>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((cert) => (
                  <div key={cert} className="border-l-2 border-green-500 pl-4">
                    <h3 className="text-lg font-semibold">{t(`cv.certifications.cert${cert}.title`)}</h3>
                    <p className="text-green-400 font-medium">{t(`cv.certifications.cert${cert}.issuer`)}</p>
                    <p className="text-gray-400 text-sm">{t(`cv.certifications.cert${cert}.date`)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function CVContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading CV...</div>
      </div>
    }>
      <CVContentInner />
    </Suspense>
  )
}

