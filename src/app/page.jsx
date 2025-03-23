"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-center grow items-center justify-center grow w-full bg-[#efefef]">
      <div><img src="home3.gif"  /></div>
      <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl space-y-8 text-center"
      >
        {/* Heading with animated gradient */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-bold leading-tight mb-6"
          style={{
            backgroundImage: "linear-gradient(45deg, #1f2d5b, #003f7f)",  // Darker blue shades
            WebkitBackgroundClip: "text",
            color: "transparent",
            display: "inline-block",
          }}
        >
          Create Beautiful Forms in Minutes
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-xl text-[#4a5568] max-w-2xl mx-auto leading-relaxed"
        >
          Build custom forms, collect responses, and analyze data with our intuitive form builder.
        </motion.p>

        {/* Buttons with hover and scale animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex gap-4 md:gap-6 justify-center max-md:flex-col"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#1f2d5b] to-[#003f7f] text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"  // Darker blue shades
            >
              <Link href="/forms/create" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create Form
              </Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-white text-[#1f2d5b] border-[#cbd5e0] shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"  // Darker blue text
            >
              <Link href="/forms" className="flex items-center gap-2">
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
