// components/forms/form-filler.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  CalendarIcon,
  InfoIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ChevronLeftIcon,
  Loader2Icon,
  StarIcon,
  File,
} from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

export default function FormFiller({ form, previewMode, className }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [remainingQuestions, setRemainingQuestions] = useState(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Dynamic Validation Schema
  const fieldSchemas = useMemo(() => {
    return form.questions.reduce((acc, question) => {
      let baseSchema;

      switch (question.type) {
        case 'DATE':
          baseSchema = z.date().optional();
          break;
        case 'CHECKBOX':
          baseSchema = z.array(z.string()).optional();
          break;
        case 'FILE':
          baseSchema = z.any().optional();
          break;
        case 'RATING':
          baseSchema = z
            .number()
            .min(1)
            .max(parseInt(question.scale) || 5)
            .optional();
          break;
        case 'EMAIL':
          baseSchema = z.string().email('Please enter a valid email address');
          break;
        case 'NUMBER':
          baseSchema = z
            .number()
            .or(z.string().regex(/^\d+$/).transform(Number));
          break;
        default:
          baseSchema = z.string();
      }

      if (question.required) {
        if (question.type === 'CHECKBOX') {
          acc[`question_${question.id}`] = baseSchema.refine(
            (val) => val && val.length > 0,
            {
              message: `${question.label} is required`,
            }
          );
        } else if (question.type === 'DATE') {
          acc[`question_${question.id}`] = z.date({
            required_error: `${question.label} is required`,
          });
        } else if (question.type === 'NUMBER') {
          let schema = baseSchema;
          if (question.validationRules?.min !== undefined) {
            schema = schema.min(question.validationRules.min, {
              message: `Value must be at least ${question.validationRules.min}`,
            });
          }
          if (question.validationRules?.max !== undefined) {
            schema = schema.max(question.validationRules.max, {
              message: `Value must be at most ${question.validationRules.max}`,
            });
          }
          acc[`question_${question.id}`] = schema;
        } else if (question.type === 'TEXT' || question.type === 'EMAIL') {
          let schema = baseSchema.min(1, {
            message: `${question.label} is required`,
          });

          if (question.validationRules?.minLength !== undefined) {
            schema = schema.min(question.validationRules.minLength, {
              message: `Must be at least ${question.validationRules.minLength} characters`,
            });
          }
          if (question.validationRules?.maxLength !== undefined) {
            schema = schema.max(question.validationRules.maxLength, {
              message: `Must be at most ${question.validationRules.maxLength} characters`,
            });
          }
          acc[`question_${question.id}`] = schema;
        } else {
          acc[`question_${question.id}`] = baseSchema.min(1, {
            message: `${question.label} is required`,
          });
        }
      } else {
        acc[`question_${question.id}`] = baseSchema.optional();
      }

      return acc;
    }, {});
  }, [form.questions]);

  const formSchema = z.object(fieldSchemas);

  // Enhanced Form Setup
  const formMethods = useForm({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: form.questions.reduce((acc, question) => {
      switch (question.type) {
        case 'CHECKBOX':
          acc[`question_${question.id}`] = [];
          break;
        case 'RATING':
          acc[`question_${question.id}`] = 0;
          break;
        case 'NUMBER':
          acc[`question_${question.id}`] = '';
          break;
        default:
          acc[`question_${question.id}`] = '';
      }
      return acc;
    }, {}),
  });

  // Progress Tracking
  useEffect(() => {
    const subscription = formMethods.watch((value, { name }) => {
      const { errors } = formMethods.formState;
      const totalQuestions = form.questions.length;
      const completedQuestions = form.questions.filter((question) => {
        const fieldValue = value[`question_${question.id}`];
        return (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== '' &&
          (typeof fieldValue !== 'object' ||
            ((Array.isArray(fieldValue) ? fieldValue.length > 0 : true) &&
              !errors[`question_${question.id}`]))
        );
      }).length;

      const progressPercentage = Math.round(
        (completedQuestions / totalQuestions) * 100
      );
      setFormProgress(progressPercentage);
      setRemainingQuestions(totalQuestions - completedQuestions);
    });

    return () => subscription.unsubscribe();
  }, [formMethods, form.questions]);

  // Enhanced Submission Handler
  const onSubmit = async (data) => {
    if (previewMode) {
      toast.info('This is a preview mode. Form submission is disabled.');
      return;
    }

    setIsSubmitting(true);
    setShowValidationSummary(
      Object.keys(formMethods.formState.errors).length > 0
    );

    try {
      const answers = Object.entries(data).map(([key, value]) => ({
        questionId: key.replace('question_', ''),
        value:
          typeof value === 'object' && value instanceof Date
            ? value.toISOString()
            : Array.isArray(value)
              ? JSON.stringify(value)
              : value.toString(),
      }));

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          answers,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit response');

      toast.success('Your response has been recorded!', {
        description: 'Thank you for your submission!',
        icon: <CheckCircle2Icon className="text-green-500" />,
        action: {
          label: 'View Responses',
          onClick: () => router.push(`/forms/${form.id}/responses`),
        },
      });
      router.push(`/forms/${form.id}/confirmation`);
    } catch (error) {
      toast.error('Submission failed', {
        description:
          error.message || 'Please check your answers and try again.',
        icon: <XCircleIcon className="text-red-500" />,
        action: {
          label: 'Retry',
          onClick: () => onSubmit(data),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tooltip Component
  const renderTooltip = (content) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="h-4 w-4 ml-2 text-muted-foreground cursor-help hover:text-primary transition-colors" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px]">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Enhanced Field Rendering
  const renderFieldByType = (question, field) => {
    switch (question.type) {
      case 'TEXT':
        return (
          <div className="relative group">
            <FormControl>
              <Input
                {...field}
                placeholder={question.placeholder || ''}
                disabled={previewMode}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300',
                  'placeholder-gray-400 text-gray-800 text-base',
                  'group-hover:border-gray-300',
                  'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:border-primary',
                  previewMode && 'opacity-60 cursor-not-allowed'
                )}
              />
            </FormControl>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
          </div>
        );

      case 'EMAIL':
        return (
          <div className="relative group">
            <FormControl>
              <div className="flex items-center">
                <div className="absolute left-3 text-gray-400 group-focus-within:text-primary transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <Input
                  type="email"
                  {...field}
                  placeholder={question.placeholder || 'example@email.com'}
                  disabled={previewMode}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300',
                    'placeholder-gray-400 text-gray-800 text-base',
                    'group-hover:border-gray-300',
                    'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:border-primary',
                    previewMode && 'opacity-60 cursor-not-allowed'
                  )}
                />
              </div>
            </FormControl>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
          </div>
        );

      case 'NUMBER':
        return (
          <div className="relative group">
            <FormControl>
              <div className="flex items-center">
                <Input
                  type="number"
                  {...field}
                  placeholder={question.placeholder || ''}
                  disabled={previewMode}
                  min={question.validationRules?.min}
                  max={question.validationRules?.max}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300',
                    'placeholder-gray-400 text-gray-800 text-base appearance-none',
                    'group-hover:border-gray-300',
                    'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:border-primary',
                    previewMode && 'opacity-60 cursor-not-allowed'
                  )}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === '' ? '' : Number(value));
                  }}
                />
              </div>
            </FormControl>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
          </div>
        );

      case 'DROPDOWN':
        return (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={previewMode}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300',
                  'text-base text-gray-800 hover:border-gray-300',
                  'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:border-primary',
                  previewMode && 'opacity-60 cursor-not-allowed'
                )}
              >
                <SelectValue
                  placeholder="Select an option"
                  className="text-gray-500"
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              {question.options.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.value}
                  className={cn(
                    'px-4 py-2 hover:bg-primary/10 focus:bg-primary/20 cursor-pointer transition-colors',
                    'text-base text-gray-700 dark:text-gray-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/30'
                  )}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'CHECKBOX':
        return (
          <FormControl>
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors group"
                >
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    value={option.value}
                    checked={field.value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, option.value]);
                      } else {
                        field.onChange(
                          field.value.filter((value) => value !== option.value)
                        );
                      }
                    }}
                    disabled={previewMode}
                    className={cn(
                      'h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary',
                      'focus:ring-2 focus:ring-primary/30 transition-all',
                      previewMode && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.id}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </FormControl>
        );

      case 'RADIO':
        return (
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="space-y-3"
              disabled={previewMode}
            >
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors group"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-${option.id}`}
                    className={cn(
                      'h-5 w-5 border-2 text-primary focus:ring-2 focus:ring-primary/30 transition-all',
                      previewMode && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                  <Label
                    htmlFor={`${question.id}-${option.id}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'DATE':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    'px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300',
                    'focus:border-primary focus:ring-2 focus:ring-primary/30',
                    !field.value && 'text-gray-500',
                    'transition-all duration-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
                    previewMode && 'opacity-60 cursor-not-allowed'
                  )}
                  disabled={previewMode}
                >
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                  {field.value ? format(field.value, 'PPP') : 'Select a date'}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
              align="start"
            >
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                disabled={previewMode}
                className="rounded-lg border dark:border-gray-700"
              />
            </PopoverContent>
          </Popover>
        );

      case 'FILE':
        return (
          <FormControl>
            <div className="flex items-center gap-4">
              <label
                className={cn(
                  'flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer',
                  'hover:border-primary hover:bg-primary/5 transition-all duration-300',
                  'text-gray-600 dark:text-gray-300 dark:border-gray-700',
                  previewMode && 'opacity-60 cursor-not-allowed'
                )}
              >
                <File className="mr-2 h-5 w-5" />
                <span className="text-sm">
                  {field.value?.name ? field.value.name : 'Choose a file'}
                </span>
                <Input
                  type="file"
                  onChange={(e) => field.onChange(e.target.files[0])}
                  disabled={previewMode}
                  className="hidden"
                />
              </label>
              {field.value?.name && (
                <Badge
                  variant="outline"
                  className="text-sm font-normal dark:bg-gray-700 dark:text-gray-300"
                >
                  {field.value.name}
                </Badge>
              )}
            </div>
          </FormControl>
        );

      case 'RATING':
        const scale = parseInt(question.scale) || 5;
        return (
          <FormControl>
            <div className="flex items-center gap-2">
              {[...Array(scale)].map((_, i) => (
                <Button
                  key={i}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-full transition-all duration-300 group',
                    field.value > i
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'text-gray-400 hover:bg-primary/10 hover:text-primary',
                    'focus:ring-2 focus:ring-primary/30',
                    previewMode && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => field.onChange(i + 1)}
                  disabled={previewMode}
                >
                  <StarIcon
                    className={cn(
                      'h-6 w-6 transition-all duration-300',
                      field.value > i
                        ? 'fill-current text-white'
                        : 'text-gray-300 group-hover:text-primary/50'
                    )}
                  />
                </Button>
              ))}
            </div>
          </FormControl>
        );

      default:
        return (
          <div className="relative group">
            <FormControl>
              <Textarea
                {...field}
                placeholder={question.placeholder || ''}
                disabled={previewMode}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300',
                  'placeholder-gray-400 text-gray-800 text-base min-h-[120px]',
                  'group-hover:border-gray-300',
                  'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:border-primary',
                  previewMode && 'opacity-60 cursor-not-allowed'
                )}
              />
            </FormControl>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300"></div>
          </div>
        );
    }
  };

  // Validation Summary Component
  const ValidationSummary = () => {
    if (
      !showValidationSummary ||
      Object.keys(formMethods.formState.errors).length === 0
    )
      return null;

    const errors = formMethods.formState.errors;
    const errorList = Object.entries(errors).map(([key, error]) => ({
      questionId: key.replace('question_', ''),
      message: error.message,
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 border border-destructive/20 rounded-lg bg-destructive/5"
      >
        <div className="flex items-center gap-2 text-destructive mb-3">
          <XCircleIcon className="h-5 w-5" />
          <h3 className="font-semibold">Please fix the following errors:</h3>
        </div>
        <ul className="space-y-2 text-sm">
          {errorList.map((error) => {
            const question = form.questions.find(
              (q) => q.id === error.questionId
            );
            return (
              <li key={error.questionId} className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <div>
                  <span className="font-medium">{question?.label}:</span>
                  <span className="ml-2 text-destructive/90">
                    {error.message}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-black dark:text-gray-100">
      {/* Enhanced Header with Animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-4 py-6 bg-gray-50 dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-4xl mx-auto container">
          <h1 className="flex flex-col sm:flex-row items-start sm:items-center text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            <span className="mr-3">{form.title}</span>
            {previewMode && (
              <Badge
                variant="outline"
                className="mt-2 sm:mt-0 text-sm font-normal text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400"
              >
                Preview Mode
              </Badge>
            )}
          </h1>
          {form.description && (
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
              {form.description}
            </p>
          )}

          {/* Enhanced Progress Bar */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Form Completion
              </span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {formProgress}%
              </span>
            </div>
            <Progress
              value={formProgress}
              className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <Progress.Indicator className="bg-blue-700 dark:bg-blue-500 transition-all duration-500 ease-in-out" />
            </Progress>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {remainingQuestions === null ? (
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  Please proceed to fill the form!
                </span>
              ) : remainingQuestions === 0 ? (
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  ✨ All questions completed! Ready to submit. ✨
                </span>
              ) : (
                <>
                  <span className="font-medium text-blue-700 dark:text-blue-400">
                    {remainingQuestions}
                  </span>{' '}
                  {remainingQuestions === 1 ? 'question' : 'questions'}{' '}
                  remaining
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Content with Enhanced Styling */}
      <div className="flex flex-col w-full flex-grow overflow-auto py-8 px-4">
        <Card
          className={cn(
            'flex-grow max-w-4xl w-full mx-auto rounded-xl shadow-lg transition-all duration-300 ease-in-out py-4',
            previewMode
              ? 'border-yellow-100 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30'
              : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800'
          )}
        >
          <Form {...formMethods}>
            <form
              onSubmit={formMethods.handleSubmit(onSubmit)}
              className="flex flex-col grow justify-between h-full space-y-1"
            >
              <div>
                <CardContent className="space-y-6 pt-2">
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {form.questions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <FormField
                            control={formMethods.control}
                            name={`question_${question.id}`}
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <FormLabel className="flex items-center text-base text-black dark:text-gray-100">
                                    <span className="mr-2 text-gray-600 dark:text-gray-400">
                                      {index + 1}.{' '}
                                    </span>
                                    {question.label}
                                    {question.required && (
                                      <span className="text-red-600 dark:text-red-400 ml-1">
                                        *
                                      </span>
                                    )}
                                    {question.description &&
                                      renderTooltip(question.description)}
                                  </FormLabel>
                                  {!question.required && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Optional
                                    </span>
                                  )}
                                </div>

                                {renderFieldByType(question, field)}

                                {question.placeholder &&
                                  question.type !== 'TEXT' && (
                                    <FormDescription className="text-sm text-gray-600 dark:text-gray-400">
                                      {question.placeholder}
                                    </FormDescription>
                                  )}
                                <FormMessage className="text-sm text-red-600 dark:text-red-400" />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  <ValidationSummary />
                </CardContent>
              </div>
              <CardFooter className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isSubmitting || previewMode}
                  className="gap-1 text-black dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || previewMode}
                  className="min-w-[150px] gap-1 bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Form
                      <CheckCircle2Icon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {previewMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-yellow-800 dark:text-yellow-400 text-sm"
          >
            You are in preview mode. Form submission is disabled.
          </motion.div>
        )}
      </div>

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="py-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      >
        © {new Date().getFullYear()} Form Builder. All rights reserved.
      </motion.footer>
    </div>
  );
}
