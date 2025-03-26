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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTheme } from 'next-themes';

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
  const [currentPage, setCurrentPage] = useState(1);

  const { theme } = useTheme();

  const responsesPerPage = 10;

  // Theme color definitions
  const themeColors = {
    light: {
      background: 'bg-white',
      text: 'text-black',
      cardBg: 'bg-gray-100',
      cardBorder: 'border-gray-200',
      accent: 'text-blue-900',
      hoverBg: 'hover:bg-gray-200',
      dropdownBg: 'bg-white',
      tableBg: 'bg-white',
      iconColor: 'text-blue-900',
    },
    dark: {
      background: 'bg-gray-900',
      text: 'text-white',
      cardBg: 'bg-gray-800',
      cardBorder: 'border-gray-700',
      accent: 'text-blue-400',
      hoverBg: 'hover:bg-gray-700',
      dropdownBg: 'bg-gray-800',
      tableBg: 'bg-gray-900',
      iconColor: 'text-blue-400',
    },
  };

  const colors = themeColors[theme];

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

  // Pagination
  const paginatedResponses = useMemo(() => {
    const startIndex = (currentPage - 1) * responsesPerPage;
    return filteredResponses.slice(startIndex, startIndex + responsesPerPage);
  }, [filteredResponses, currentPage]);

  const totalPages = Math.ceil(filteredResponses.length / responsesPerPage);

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
    <div
      className={`${colors.background} ${colors.text} min-h-screen p-4 sm:p-6 space-y-6 relative`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <h1
          className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${colors.text}`}
        >
          <FileText className={`h-6 w-6 md:h-8 md:w-8 ${colors.iconColor}`} />
          {form?.title || 'Form Responses'}
        </h1>
        <Button
          onClick={() => exportToCSV(responses, form)}
          disabled={!responses.length}
          className={`bg-blue-900 hover:bg-blue-800 text-white gap-2 w-full md:w-auto ${colors.text}`}
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          {
            title: 'Total Responses',
            value: responseStats.total,
            icon: Users,
            bgColor: theme === 'dark' ? 'bg-blue-900/50' : 'bg-black/10',
            textColor: theme === 'dark' ? 'text-blue-200' : 'text-black',
          },
          {
            title: 'Unique Respondents',
            value: responseStats.unique,
            icon: User,
            bgColor: theme === 'dark' ? 'bg-green-900/50' : 'bg-black/10',
            textColor: theme === 'dark' ? 'text-green-200' : 'text-black',
          },
          {
            title: 'Last Response',
            value: responseStats.lastResponse
              ? formatDate(responseStats.lastResponse)
              : 'N/A',
            icon: Calendar,
            bgColor: theme === 'dark' ? 'bg-yellow-900/50' : 'bg-black/10',
            textColor: theme === 'dark' ? 'text-yellow-200' : 'text-black',
          },
          {
            title: 'Avg. Completion',
            value: form?.questions?.length
              ? `${Math.round((responseStats.questionStats[0].responses.length / responseStats.total) * 100)}%`
              : 'N/A',
            icon: BarChart2,
            bgColor: theme === 'dark' ? 'bg-purple-900/50' : 'bg-black/10',
            textColor: theme === 'dark' ? 'text-purple-200' : 'text-black',
          },
        ].map(({ title, value, icon: Icon, bgColor, textColor }) => (
          <Card
            key={title}
            className={`flex flex-col m-0 p-3 hover:shadow-lg transition-shadow ${bgColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <CardTitle className={`text-xs md:text-sm ${textColor}`}>
                {title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${textColor}`} />
            </div>
            <div className={`text-xl md:text-2xl font-bold ${textColor}`}>
              {value}
            </div>
          </Card>
        ))}
      </div>

      {/* Visualization Section */}
      <Card
        className={`${colors.cardBg} ${colors.cardBorder} border hover:bg-opacity-80 transition-colors duration-300 py-4 m-0 mb-4`}
      >
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${colors.text}`}>
            <BarChart2 className={`h-5 w-5 ${colors.iconColor}`} />
            Response Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="h-48 md:h-64 -ml-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Object.entries(responseStats.timeline).map(
                ([date, count]) => ({ date, count })
              )}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'dark' ? '#4b5563' : '#94a3b8'}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: theme === 'dark' ? 'white' : 'black' }}
              />
              <YAxis tick={{ fill: theme === 'dark' ? 'white' : 'black' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : 'white',
                  borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                }}
                itemStyle={{ color: theme === 'dark' ? 'white' : 'black' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={theme === 'dark' ? '#3b82f6' : '#00008B'}
                strokeWidth={2}
                dot={{ fill: theme === 'dark' ? '#3b82f6' : '#00008B' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className={`absolute left-3 top-3 h-5 w-5 ${colors.iconColor}`}
          />
          <Input
            placeholder="Search responses..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`pl-10 h-11 ${colors.background} border-gray-500 ${colors.text} focus:border-blue-500`}
            disabled={!responses.length}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`w-full md:w-auto h-11 gap-2 ${colors.background} border-gray-500 ${colors.text} ${colors.hoverBg}`}
            >
              <Filter className={`h-4 w-4 ${colors.iconColor}`} />
              Filters
              <ChevronDown className="h-4 w-4 opacity-50 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={`${colors.dropdownBg} border-gray-500 ${colors.text}`}
          >
            <DropdownMenuLabel className={`${colors.text} opacity-80`}>
              Filter Responses
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-500" />
            <DropdownMenuItem
              className={`flex items-center gap-2 ${colors.hoverBg}`}
              onSelect={(event) => event.preventDefault()}
            >
              <Calendar className={`h-4 w-4 ${colors.iconColor}`} />
              <Input
                type="date"
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full flex justify-evenly ${colors.background} ${colors.text} border-blue-500 focus:border-blue-400`}
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`flex items-center gap-2 ${colors.hoverBg}`}
              onSelect={(event) => event.preventDefault()}
            >
              <User className={`h-4 w-4 ${colors.iconColor}`} />
              <div className="w-full">
                <select
                  onChange={(e) => {
                    setFilterUser(e.target.value);
                    setCurrentPage(1);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full ${colors.background} ${colors.text} outline-none`}
                >
                  <option value="" className={colors.background}>
                    All Respondents
                  </option>
                  {[...new Set(responses.map((r) => r.user?.email))]
                    .filter(Boolean)
                    .map((email) => (
                      <option
                        key={email}
                        value={email}
                        className={colors.background}
                      >
                        {email}
                      </option>
                    ))}
                </select>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Responses List */}
      {paginatedResponses.length === 0 ? (
        <Card
          className={`${colors.background} ${colors.cardBorder} border m-0 mb-16`}
        >
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertCircle className={`h-12 w-12 ${colors.iconColor} mb-4`} />
            <h3 className={`text-xl font-semibold ${colors.text}`}>
              {responses.length === 0
                ? 'No responses collected yet'
                : 'No matching responses found'}
            </h3>
            <p className={`${colors.text} opacity-60 mt-2`}>
              {responses.length === 0
                ? 'Share your form to start collecting responses'
                : 'Try adjusting your filters or search terms'}
            </p>
          </div>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4 mb-16">
          {paginatedResponses.map((response) => (
            <Card
              key={response.id}
              className={`${colors.background} ${colors.cardBorder} border m-0 mb-4`}
            >
              <AccordionItem
                value={response.id}
                className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Card
                  className={`${colors.background} border-none outline-none shadow-none`}
                >
                  <AccordionTrigger
                    className={`px-4 sm:px-6 hover:no-underline ${colors.text}`}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium text-sm sm:text-base ${colors.text} opacity-80`}
                        >
                          {response.user?.name || 'Anonymous'}
                        </span>
                        {response.user?.email && (
                          <span
                            className={`text-xs sm:text-sm ${colors.text} opacity-60`}
                          >
                            ({response.user.email})
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs sm:text-sm ${colors.text} opacity-50`}
                      >
                        {formatDate(response.createdAt)}
                      </div>
                    </div>
                  </AccordionTrigger>
                </Card>
                <Card
                  className={`${colors.background} border-none outline-none shadow-none`}
                >
                  <AccordionContent className="px-4 sm:px-6">
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader className={colors.cardBg}>
                          <TableRow className={colors.hoverBg}>
                            <TableHead
                              className={`w-1/2 min-w-[200px] ${colors.text} opacity-80`}
                            >
                              Question
                            </TableHead>
                            <TableHead className={`${colors.text} opacity-80`}>
                              Response
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.questions.map((question) => {
                            const answer = response.answers.find(
                              (a) => a.questionId === question.id
                            );
                            return (
                              <TableRow
                                key={question.id}
                                className={colors.hoverBg}
                              >
                                <TableCell
                                  className={`font-medium text-xs sm:text-sm ${colors.text}`}
                                >
                                  {question.label}
                                  {question.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </TableCell>
                                <TableCell
                                  className={`text-xs sm:text-sm ${colors.text} opacity-80`}
                                >
                                  {answer?.value || (
                                    <span
                                      className={`${colors.text} opacity-50 italic`}
                                    >
                                      No response
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}

      {/* Sticky Pagination */}
      {filteredResponses.length > 0 && (
        <div
          className={`fixed bottom-0 left-0 right-0 ${colors.background} shadow-lg z-50 p-4 border-t ${colors.cardBorder}`}
        >
          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`${colors.background} ${colors.text} border-gray-500 ${colors.hoverBg}`}
            >
              <ChevronLeft className={`h-4 w-4 ${colors.iconColor}`} />
            </Button>
            <span className={`text-sm ${colors.text}`}>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className={`${colors.background} ${colors.text} border-gray-500 ${colors.hoverBg}`}
            >
              <ChevronRight className={`h-4 w-4 ${colors.iconColor}`} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
