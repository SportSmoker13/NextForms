'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  ArrowDown, 
  ArrowUp,
  GripVertical
} from 'lucide-react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ==========================================
// Validation Schemas
// ==========================================
const questionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Question text is required'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  type: z.enum(['TEXT', 'DROPDOWN', 'CHECKBOX', 'RADIO', 'DATE', 'FILE', 'RATING']),
  options: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1, 'Option label required'),
      value: z.string().min(1, 'Option value required')
    })
  ).optional(),
  order: z.number()
});

const formSchema = z.object({
  title: z.string().min(1, 'Form title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'Add at least one question')
});

// ==========================================
// Form Builder Component
// ==========================================
export default function FormBuilder({ formData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggingOver, setDraggingOver] = useState(null);
  const dragItemRef = useRef(null);
  const dragOverItemRef = useRef(null);

  // Initialize form with default values
  const form = useForm({
    // resolver: zodResolver(formSchema),
    defaultValues: formData ? {
      title: formData.title,
      description: formData.description || '',
      questions: formData.questions.map(q => ({
        ...q,
        options: q.options || []
      }))
    } : {
      title: '',
      description: '',
      questions: [{
        label: '',
        type: 'TEXT',
        required: false,
        options: [],
        order: 0
      }]
    }
  });

  const { fields, append, remove, move, swap } = useFieldArray({
    control: form.control,
    name: 'questions'
  });

  const watchedQuestions = form.watch('questions');

  // ==========================================
  // Form Submission Handler
  // ==========================================
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Update order values before submission
      data.questions = data.questions.map((question, index) => ({
        ...question,
        order: index
      }));

      const method = formData ? 'PUT' : 'POST';
      const url = formData ? `/api/forms/${formData.id}` : '/api/forms';
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) throw new Error('Form save failed');
  
      toast.success(`Form ${formData ? 'updated' : 'created'} successfully`);
      
      // Redirect to /forms after successful submission
      router.push('/forms');
  
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ==========================================
  // Question Manipulation Functions
  // ==========================================
  const addQuestion = () => append({
    label: '',
    type: 'TEXT',
    required: false,
    options: [],
    order: fields.length
  });

  const moveQuestion = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      move(index, newIndex);
    }
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
    const currentOptions = form.getValues(`questions.${questionIndex}.options`) || [];
    form.setValue(`questions.${questionIndex}.options`, [
      ...currentOptions,
      { label: '', value: '' }
    ]);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const currentOptions = [...form.getValues(`questions.${questionIndex}.options`)];
    currentOptions.splice(optionIndex, 1);
    form.setValue(`questions.${questionIndex}.options`, currentOptions);
  };

  // ==========================================
  // Helper Components
  // ==========================================
  const QuestionTypeSelect = ({ index, value }) => (
    <div className="space-y-2">
      <Label>Question Type</Label>
      <Select
        value={value}
        onValueChange={(value) => form.setValue(`questions.${index}.type`, value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TEXT">Text Input</SelectItem>
          {/* <SelectItem value="DROPDOWN">Dropdown</SelectItem> */}
          {/* <SelectItem value="CHECKBOX">Checkbox Group</SelectItem> */}
          {/* <SelectItem value="RADIO">Radio Group</SelectItem> */}
          <SelectItem value="DATE">Date Picker</SelectItem>
          <SelectItem value="FILE">File Upload</SelectItem>
          <SelectItem value="RATING">Rating Scale</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const OptionsList = ({ questionIndex, options }) => (
    <div className="space-y-4">
      <Label>
        {watchedQuestions[questionIndex].type === 'DROPDOWN' ? 'Dropdown Options' : 
         watchedQuestions[questionIndex].type === 'CHECKBOX' ? 'Checkbox Options' : 'Radio Options'}
      </Label>
      <div className="space-y-2">
        {options?.map((option, optionIndex) => (
          <div key={optionIndex} className="flex gap-2">
            <Input
              {...form.register(`questions.${questionIndex}.options.${optionIndex}.label`)}
              placeholder="Option label"
            />
            <Input
              {...form.register(`questions.${questionIndex}.options.${optionIndex}.value`)}
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

  const RatingOptions = ({ index, value }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Scale (1-10)</Label>
        <Select
          value={value || '5'}
          onValueChange={(value) => form.setValue(`questions.${index}.scale`, value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select scale" />
          </SelectTrigger>
          <SelectContent>
            {[3, 5, 7, 10].map(num => (
              <SelectItem key={num} value={num.toString()}>{num} Points</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // ==========================================
  // Render Form
  // ==========================================
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Details Card */}
      <Card>
        <div className="p-6 space-y-6">
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
          </div>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button className="cursor-pointer" type="button" onClick={addQuestion}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card 
            key={field.id} 
            className={`p-6 space-y-4 ${draggedItem === index ? 'opacity-50' : ''} ${draggingOver === index ? 'border-2 border-blue-400' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            {/* Question Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="cursor-move mr-2" title="Drag to reorder">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-medium">Question {index + 1}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={index === 0 ? "cursor-not-allowed" : 'cursor-pointer'}
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  className={index === fields.length - 1 ? "cursor-not-allowed" : 'cursor-pointer'}
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
              </div>
            </div>

            {/* Question Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text *</Label>
                <Input
                  {...form.register(`questions.${index}.label`)}
                  placeholder="Enter your question"
                />
                {form.formState.errors.questions?.[index]?.label && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.questions[index].label.message}
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
                      form.setValue(`questions.${index}.required`, checked)
                    }
                    id={`required-${index}`}
                  />
                  <Label htmlFor={`required-${index}`}>Required</Label>
                </div>
              </div>

              {/* Placeholder field */}
              <div className="space-y-2">
                <Label>Placeholder Text</Label>
                <Input
                  {...form.register(`questions.${index}.placeholder`)}
                  placeholder="Enter placeholder text"
                />
              </div>

              {/* Options for multi-choice question types */}
              {['DROPDOWN', 'CHECKBOX', 'RADIO'].includes(watchedQuestions[index].type) && (
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
            </div>
          </Card>
        ))}
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
        <Button className={isSubmitting ? "cursor-not-allowed" : 'cursor-pointer'} type="submit" disabled={isSubmitting}>
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
    </form>
  );
}