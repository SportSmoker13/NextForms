'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 sec
  };

  return (
    <Button variant="secondary" className="cursor-pointer" onClick={handleCopy}>
      <Copy className="h-4 w-4" />
      {copied && <span className="ml-2 text-xs">Copied!</span>}
    </Button>
  );
}
