'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  PlusCircle,
  Trash2,
  Save,
  ArrowDown,
  ArrowUp,
  GripVertical,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// Enhanced Validation Schemas
// ==========================================
const questionSchema = z.object({
  label: z
    .string()
    .min(3, 'Question must be at least 3 characters')
    .max(200, 'Question cannot exceed 200 characters'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  type: z.enum([
    'TEXT',
    'DROPDOWN',
    'CHECKBOX',
    'RADIO',
    'DATE',
    'FILE',
    'RATING',
    'EMAIL',
    'NUMBER',
  ]),
  validationRules: z
    .object({
      minLength: z.number().min(0).optional(),
      maxLength: z.number().min(1).optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
    })
    .optional(),
  options: z
    .array(
      z.object({
        label: z.string().min(1, 'Option label required'),
        value: z.string().min(1, 'Option value required'),
      })
    )
    .optional(),
  scale: z.number().optional(),
  order: z.number(),
});

const formSchema = z.object({
  title: z.string().min(3, 'Form title must be at least 3 characters'),
  description: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required'),
});

// ==========================================
// Form Builder Component
// ==========================================
export default function FormBuilder({ formData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggingOver, setDraggingOver] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);

  // Initialize form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: formData
      ? {
          title: formData.title,
          description: formData.description || '',
          questions: formData.questions.map((q) => ({
            label: q.label,
            placeholder: q.placeholder || '',
            required: q.required,
            type: q.type,
            options: q.options.map((o) => ({ label: o.label, value: o.value })),
            validationRules: {
              minLength: q.minLength ?? undefined,
              maxLength: q.maxLength ?? undefined,
              min: q.min ?? undefined,
              max: q.max ?? undefined,
              pattern: q.pattern ?? undefined,
            },
            scale: q.scale ?? undefined,
            order: q.order,
          })),
        }
      : {
          title: '',
          description: '',
          questions: [
            {
              label: '',
              type: 'TEXT',
              required: false,
              options: [],
              order: 0,
              validationRules: {},
            },
          ],
        },
  });

  const { fields, append, remove, move, swap } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const watchedQuestions = form.watch('questions');

  // ==========================================
  // Form Submission Handler
  // ==========================================
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Validate data before submission
      const validationResult = formSchema.safeParse(data);
      if (!validationResult.success) {
        // Log detailed validation errors
        console.error('Validation Errors:', validationResult.error.errors);
        toast.error('Please fix form validation errors');
        setIsSubmitting(false);
        return;
      }

      const transformedData = {
        title: data.title,
        description: data.description || '',
        questions: data.questions.map((question, index) => ({
          label: question.label,
          placeholder: question.placeholder || '',
          required: question.required,
          type: question.type,
          options:
            question.type === 'DROPDOWN' ||
            question.type === 'CHECKBOX' ||
            question.type === 'RADIO'
              ? (question.options || []).filter((opt) => opt.label && opt.value)
              : [],
          validationRules: {
            minLength: question.validationRules?.minLength,
            maxLength: question.validationRules?.maxLength,
            min: question.validationRules?.min,
            max: question.validationRules?.max,
            pattern: question.validationRules?.pattern,
          },
          scale: question.type === 'RATING' ? question.scale || 5 : undefined, // Default to 5 if not set
          order: index,
        })),
      };

      const method = formData ? 'PUT' : 'POST';
      const url = formData ? `/api/forms/${formData.id}` : '/api/forms';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if required
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        // Try to parse error message from response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Form save failed');
      }

      toast.success(`Form ${formData ? 'updated' : 'created'} successfully`);
      router.push('/forms');
    } catch (error) {
      console.error('Submission Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Question Manipulation Functions
  // ==========================================
  const addQuestion = () => {
    append({
      label: '',
      type: 'TEXT',
      required: false,
      options: [],
      order: fields.length,
      validationRules: {},
    });
    setExpandedQuestion(fields.length);
  };

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      move(index, newIndex);
    }
  };

  const toggleQuestionExpand = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // ==========================================
  // Drag and Drop Handlers
  // ==========================================
  const handleDragStart = (e, index) => {
    dragItemRef.current = index;
    setDraggedItem(index);

    // For better visual feedback during drag
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);

    // Add a slight delay for visual feedback
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedItem(null);
    setDraggingOver(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragItemRef.current === index) return;
    dragOverItemRef.current = index;
    setDraggingOver(index);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (dragItemRef.current === index) return;
    setDraggingOver(index);
  };

  const handleDragLeave = () => {
    setDraggingOver(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const draggedItemIndex = dragItemRef.current;
    if (draggedItemIndex === index) return;

    // Swap the items
    swap(draggedItemIndex, index);

    // Reset refs
    dragItemRef.current = null;
    dragOverItemRef.current = null;
    setDraggedItem(null);
    setDraggingOver(null);
  };

  // ==========================================
  // Option Management Functions
  // ==========================================
  const addOption = (questionIndex) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];

    // Ensure options is an array before adding
    const updatedOptions = Array.isArray(currentOptions)
      ? [...currentOptions, { label: '', value: '' }]
      : [{ label: '', value: '' }];

    form.setValue(`questions.${questionIndex}.options`, updatedOptions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions =
      form.getValues(`questions.${questionIndex}.options`) || [];

    // Safely remove the option
    const updatedOptions = currentOptions.filter(
      (_, index) => index !== optionIndex
    );

    form.setValue(`questions.${questionIndex}.options`, updatedOptions);
  };

  // ==========================================
  // Helper Components
  // ==========================================
  const QuestionTypeSelect = ({ index, value }) => (
    <div className="space-y-2">
      <Label>Question Type</Label>
      <Select
        value={value}
        onValueChange={(value) => {
          // Reset options when changing type
          form.setValue(`questions.${index}.type`, value);
          form.setValue(`questions.${index}.options`, []);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TEXT">Text Input</SelectItem>
          <SelectItem value="EMAIL">Email Input</SelectItem>
          <SelectItem value="NUMBER">Number Input</SelectItem>
          <SelectItem value="DROPDOWN">Dropdown</SelectItem>
          <SelectItem value="CHECKBOX">Checkbox Group</SelectItem>
          <SelectItem value="RADIO">Radio Group</SelectItem>
          <SelectItem value="DATE">Date Picker</SelectItem>
          <SelectItem value="FILE">File Upload</SelectItem>
          <SelectItem value="RATING">Rating Scale</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const OptionsList = ({ questionIndex, options }) => {
    // Ensure options is an array, default to empty array if not
    const safeOptions = Array.isArray(options) ? options : [];

    return (
      <div className="space-y-4">
        <Label>
          {(() => {
            switch (watchedQuestions[questionIndex].type) {
              case 'DROPDOWN':
                return 'Dropdown Options';
              case 'CHECKBOX':
                return 'Checkbox Options';
              case 'RADIO':
                return 'Radio Options';
              default:
                return 'Options';
            }
          })()}
        </Label>
        <div className="space-y-2">
          {safeOptions.map((option, optionIndex) => (
            <div key={optionIndex} className="flex gap-2">
              <Input
                value={option.label || ''}
                onChange={(e) => {
                  const currentOptions =
                    form.getValues(`questions.${questionIndex}.options`) || [];
                  const updatedOptions = [...currentOptions];
                  updatedOptions[optionIndex] = {
                    ...updatedOptions[optionIndex],
                    label: e.target.value,
                  };
                  form.setValue(
                    `questions.${questionIndex}.options`,
                    updatedOptions
                  );
                }}
                placeholder="Option label"
              />
              <Input
                value={option.value || ''}
                onChange={(e) => {
                  const currentOptions =
                    form.getValues(`questions.${questionIndex}.options`) || [];
                  const updatedOptions = [...currentOptions];
                  updatedOptions[optionIndex] = {
                    ...updatedOptions[optionIndex],
                    value: e.target.value,
                  };
                  form.setValue(
                    `questions.${questionIndex}.options`,
                    updatedOptions
                  );
                }}
                placeholder="Option value"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(questionIndex, optionIndex)}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => addOption(questionIndex)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Option
          </Button>
        </div>
      </div>
    );
  };

  const RatingOptions = ({ index, value }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Scale (1-10)</Label>
        <Select
          value={value?.toString() || '5'}
          onValueChange={(value) =>
            form.setValue(`questions.${index}.scale`, parseInt(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select scale" />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 7, 10].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} Points
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const ValidationOptions = ({ index, type }) => {
    const validationRules = watchedQuestions[index]?.validationRules || {};

    return (
      <div className="space-y-4">
        <Label>Validation Rules</Label>
        <div className="grid grid-cols-2 gap-4">
          {['TEXT', 'EMAIL'].includes(type) && (
            <>
              <div className="space-y-2">
                <Label>Min Length</Label>
                <Input
                  type="number"
                  min="0"
                  value={validationRules.minLength || ''}
                  onChange={(e) =>
                    form.setValue(
                      `questions.${index}.validationRules.minLength`,
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Min characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Length</Label>
                <Input
                  type="number"
                  min="1"
                  value={validationRules.maxLength || ''}
                  onChange={(e) =>
                    form.setValue(
                      `questions.${index}.validationRules.maxLength`,
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Max characters"
                />
              </div>
            </>
          )}
          {type === 'NUMBER' && (
            <>
              <div className="space-y-2">
                <Label>Minimum Value</Label>
                <Input
                  type="number"
                  value={validationRules.min || ''}
                  onChange={(e) =>
                    form.setValue(
                      `questions.${index}.validationRules.min`,
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Minimum value"
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Value</Label>
                <Input
                  type="number"
                  value={validationRules.max || ''}
                  onChange={(e) =>
                    form.setValue(
                      `questions.${index}.validationRules.max`,
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder="Maximum value"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ==========================================
  // Render Form
  // ==========================================
  return (
    <TooltipProvider>
      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* Form Details Card */}
        <Card className="py-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Form Configuration
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Configure your form's basic details and questions
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input
                {...form.register('title')}
                placeholder="Enter form title"
              />
              {form.formState.errors.title && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                {...form.register('description')}
                placeholder="Form description"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questions</h2>
            <Button
              className="cursor-pointer"
              type="button"
              onClick={addQuestion}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          <AnimatePresence>
            {fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`${draggedItem === index ? 'opacity-50' : ''} ${draggingOver === index ? 'border-2 border-blue-400' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <CardContent className="p-6">
                    {/* Question Header */}
                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => toggleQuestionExpand(index)}
                      >
                        <div
                          className="cursor-move mr-2"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>
                        <h3 className="font-medium">
                          Question {index + 1}: {field.label || 'Unnamed'}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={
                            index === 0
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          }
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          className={
                            index === fields.length - 1
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          }
                          variant="ghost"
                          size="icon"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === fields.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-500 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleQuestionExpand(index)}
                        >
                          {expandedQuestion === index ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Question Content */}
                    <AnimatePresence>
                      {expandedQuestion === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4 pt-4"
                        >
                          <div className="space-y-2">
                            <Label>Question Text *</Label>
                            <Input
                              {...form.register(`questions.${index}.label`)}
                              placeholder="Enter your question"
                            />
                            {form.formState.errors.questions?.[index]
                              ?.label && (
                              <p className="text-red-500 text-sm">
                                {
                                  form.formState.errors.questions[index].label
                                    .message
                                }
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {/* Question Type Selection */}
                            <QuestionTypeSelect
                              index={index}
                              value={watchedQuestions[index].type}
                            />

                            {/* Required Toggle */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={watchedQuestions[index].required}
                                onCheckedChange={(checked) =>
                                  form.setValue(
                                    `questions.${index}.required`,
                                    checked
                                  )
                                }
                                id={`required-${index}`}
                              />
                              <Label htmlFor={`required-${index}`}>
                                Required
                              </Label>
                            </div>
                          </div>

                          {/* Placeholder field */}
                          <div className="space-y-2">
                            <Label>Placeholder Text</Label>
                            <Input
                              {...form.register(
                                `questions.${index}.placeholder`
                              )}
                              placeholder="Enter placeholder text"
                            />
                          </div>

                          {/* Options for multi-choice question types */}
                          {['DROPDOWN', 'CHECKBOX', 'RADIO'].includes(
                            watchedQuestions[index].type
                          ) && (
                            <OptionsList
                              questionIndex={index}
                              options={watchedQuestions[index].options}
                            />
                          )}

                          {/* Special settings for RATING type */}
                          {watchedQuestions[index].type === 'RATING' && (
                            <RatingOptions
                              index={index}
                              value={watchedQuestions[index].scale}
                            />
                          )}

                          {/* Validation options */}
                          {['TEXT', 'EMAIL', 'NUMBER'].includes(
                            watchedQuestions[index].type
                          ) && (
                            <ValidationOptions
                              index={index}
                              type={watchedQuestions[index].type}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            className="cursor-pointer"
            type="button"
            variant="outline"
            onClick={() => router.push('/forms')}
          >
            Cancel
          </Button>
          <Button
            className={isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </span>
            )}
          </Button>
        </div>
      </motion.form>
    </TooltipProvider>
  );
}
