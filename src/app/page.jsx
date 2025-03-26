'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row w-full items-start justify-center min-h-screen bg-[#f4f7f6] dark:bg-[#1a1a2e] transition-colors duration-300">
      <div className="w-full md:w-1/2 flex justify-start items-start mb-8 md:mb-0">
        <img
          src="home.svg"
          alt="Form Builder Demonstration"
          className="w-full h-full object-cover md:object-contain"
        />
      </div>
      <div className="w-full md:w-1/2 h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl space-y-8 text-center px-4"
        >
          {/* Heading with animated gradient */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            style={{
              backgroundImage: 'linear-gradient(45deg, #1f2d5b, #003f7f)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              display: 'inline-block',
            }}
          >
            Create Beautiful Forms in Minutes
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-base md:text-lg text-[#4a5568] dark:text-[#cbd5e0] max-w-2xl mx-auto leading-relaxed mb-8"
          >
            Build custom forms, collect responses, and analyze data with our
            intuitive form builder.
          </motion.p>

          {/* Buttons with hover and scale animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto 
                  bg-gradient-to-r from-[#1f2d5b] to-[#003f7f] 
                  dark:from-[#2c3e7a] dark:to-[#005299] 
                  text-white 
                  shadow-lg hover:shadow-xl 
                  transition-all duration-300 
                  cursor-pointer"
              >
                <Link
                  href="/forms/create"
                  className="flex items-center justify-center gap-2"
                >
                  <PlusCircle className="h-5 w-5" />
                  Create Form
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto 
                  bg-white dark:bg-[#1e1e1e] 
                  text-[#1f2d5b] dark:text-[#4a91ff] 
                  border-[#cbd5e0] dark:border-[#444] 
                  shadow-md hover:shadow-lg 
                  transition-all duration-300 
                  cursor-pointer"
              >
                <Link
                  href="/forms"
                  className="flex items-center justify-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  View Forms
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
