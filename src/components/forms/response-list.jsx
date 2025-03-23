// components/forms/response-list.jsx
'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search } from 'lucide-react';
import { Button } from '../ui/button';

export default function ResponseList({ form, responses }) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredResponses = responses.filter((response) => {
    const searchString = `${response.user?.name || ''} ${
      response.user?.email || ''
    } ${response.answers.map((a) => a.value).join(' ')}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Responses</CardTitle>
          <div className="flex items-center gap-4">
            <Button className={responses.length === 0 ? 'cursor-pointer' : 'cursor-not-allowed'} variant="outline" disabled={responses.length === 0}>
              Export CSV
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={responses.length === 0}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredResponses.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {responses.length === 0
              ? 'No responses received yet'
              : 'No matching responses found'}
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {filteredResponses.map((response) => (
              <AccordionItem
                key={response.id}
                value={response.id}
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex flex-col items-start">
                    <div className="text-left">
                      {response.user ? (
                        <>
                          <span className="font-medium">
                            {response.user.name}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            ({response.user.email})
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Anonymous response
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Submitted: {formatDate(response.createdAt)}
                    </span>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Question</TableHead>
                        <TableHead>Answer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.questions.map((question) => {
                        const answer = response.answers.find(
                          (a) => a.questionId === question.id
                        );
                        return (
                          <TableRow key={question.id}>
                            <TableCell className="font-medium">
                              {question.label}
                              {question.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {answer?.value || (
                                <span className="text-muted-foreground">
                                  No answer
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}