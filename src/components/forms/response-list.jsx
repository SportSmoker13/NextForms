'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  FileText,
  Users,
  BarChart2,
  Calendar,
  Search,
  Download,
  Filter,
  User,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

const formatDate = (date) =>
  new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const exportToCSV = (responses, form) => {
  if (!form?.questions) return;
  const headers = [
    'Respondent',
    'Submitted At',
    ...form.questions.map((q) => q.label),
  ];
  const csvRows = responses.map((response) => {
    const respondent = response.user
      ? `${response.user.name} (${response.user.email})`
      : 'Anonymous';
    const answers = form.questions.map((question) => {
      const answer = response.answers.find((a) => a.questionId === question.id);
      return answer ? `"${answer.value.replace(/"/g, '""')}"` : 'N/A';
    });
    return [respondent, formatDate(response.createdAt), ...answers];
  });

  const csvContent = [headers, ...csvRows]
    .map((row) => row.map((field) => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${form.title}_responses.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ResponseList({ form, responses }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [filterUser, setFilterUser] = useState(null);

  const filteredResponses = useMemo(
    () =>
      responses.filter((response) => {
        const matchesSearch = searchQuery
          ? response.user?.name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            response.user?.email
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            response.answers.some((a) =>
              a.value.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : true;

        const matchesDate = filterDate
          ? new Date(response.createdAt).toDateString() ===
            new Date(filterDate).toDateString()
          : true;

        const matchesUser = filterUser
          ? response.user?.email === filterUser
          : true;

        return matchesSearch && matchesDate && matchesUser;
      }),
    [responses, searchQuery, filterDate, filterUser]
  );

  const responseStats = useMemo(
    () => ({
      total: filteredResponses.length,
      unique: new Set(filteredResponses.map((r) => r.user?.email)).size,
      lastResponse: filteredResponses[0]?.createdAt || null,
      timeline: filteredResponses.reduce((acc, r) => {
        const date = new Date(r.createdAt).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
      questionStats: form?.questions?.map((q) => ({
        label: q.label,
        responses: filteredResponses.filter((r) =>
          r.answers.some((a) => a.questionId === q.id)
        ),
      })),
    }),
    [filteredResponses, form]
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          {form?.title || 'Form Responses'}
        </h1>
        <Button
          onClick={() => exportToCSV(responses, form)}
          disabled={!responses.length}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <Card className="flex justify-center flex-col py-4 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Responses</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responseStats.total}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {form?.responseLimit &&
                `${Math.round((responseStats.total / form.responseLimit) * 100)}% of target`}
            </p>
          </CardContent>
        </Card>

        <Card className="flex justify-center flex-col py-4 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Unique Respondents</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responseStats.unique}</div>
          </CardContent>
        </Card>

        <Card className="flex justify-center flex-col py-4 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Last Response</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {responseStats.lastResponse
                ? formatDate(responseStats.lastResponse)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="flex justify-center flex-col py-4 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Avg. Completion</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {form?.questions?.length
                ? `${Math.round((responseStats.questionStats[0].responses.length / responseStats.total) * 100)}%`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Section */}
      <Card className="hover:shadow-lg transition-shadow py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Response Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Object.entries(responseStats.timeline).map(
                ([date, count]) => ({ date, count })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#023c99"
                strokeWidth={2}
                dot={{ fill: '#023c99' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Controls Section */}

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />

            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white"
              disabled={!responses.length}
            />
          </div>
        </Card>

        <Card>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Filter Responses</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Input
                  type="date"
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-transparent"
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <select
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="">All Respondents</option>
                  {[...new Set(responses.map((r) => r.user?.email))]
                    .filter(Boolean)
                    .map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                </select>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Card>
      </div>
      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">
              {responses.length === 0
                ? 'No responses collected yet'
                : 'No matching responses found'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {responses.length === 0
                ? 'Share your form to start collecting responses'
                : 'Try adjusting your filters or search terms'}
            </p>
          </div>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredResponses.map((response) => (
            <Card key={response.id}>
              <AccordionItem
                value={response.id}
                className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Card className="border-none outline-none shadow-none">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {response.user?.name || 'Anonymous'}
                        </span>
                        {response.user?.email && (
                          <span className="text-sm text-muted-foreground">
                            ({response.user.email})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(response.createdAt)}
                      </div>
                    </div>
                  </AccordionTrigger>
                </Card>
                <Card className="border-none outline-none shadow-none">
                  <AccordionContent className="px-6">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow>
                          <TableHead className="w-[50%]">Question</TableHead>
                          <TableHead>Response</TableHead>
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
                                  <span className="text-muted-foreground italic">
                                    No response
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  );
}
