// components/forms/form-builder.jsx
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  PlusCircle, 
  Trash2, 
  Save, 
  ArrowDown, 
  ArrowUp 
} from 'lucide-react';
import { Button } from "../../components/ui/button";
import { Input } from "../..//components/ui/input";
import { Textarea } from "../..//components/ui/textarea";
import {Card } from "../..//components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "../..//components/ui/select";
import { Label } from "../..//components/ui/label";
import { Switch } from "../..//components/ui/switch";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Zod validation schemas
const questionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Question text is required'),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  type: z.enum(['TEXT', 'DROPDOWN']),
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

export default function FormBuilder({ formData }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm({
    resolver: zodResolver(formSchema),
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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'questions'
  });

  const watchedQuestions = form.watch('questions');

  // Form submission handler
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
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
      router.push('/forms'); // This is where you want to go after successful form submission
  
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // Question manipulation functions
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
          <Button className='cursor-pointer' type="button" onClick={addQuestion}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="p-6 space-y-4">
            {/* Question Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Question {index + 1}</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={index === 0 ? "cursor-not-allowed" : 'cursor-pointer' }
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  className={index === fields.length - 1 ? "cursor-not-allowed" : 'cursor-pointer' }
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
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={watchedQuestions[index].type}
                    onValueChange={(value) => 
                      form.setValue(`questions.${index}.type`, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text Input</SelectItem>
                      <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

              {watchedQuestions[index].type === 'DROPDOWN' && (
                <div className="space-y-4">
                  <Label>Dropdown Options</Label>
                  <div className="space-y-2">
                    {watchedQuestions[index].options?.map((option, optionIndex) => (
                      <div key={option.id} className="flex gap-2">
                        <Input
                          {...form.register(
                            `questions.${index}.options.${optionIndex}.label`
                          )}
                          placeholder="Option label"
                        />
                        <Input
                          {...form.register(
                            `questions.${index}.options.${optionIndex}.value`
                          )}
                          placeholder="Option value"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const currentOptions = [
                              ...form.getValues(
                                `questions.${index}.options`
                              )
                            ];
                            currentOptions.splice(optionIndex, 1);
                            form.setValue(
                              `questions.${index}.options`, 
                              currentOptions
                            );
                          }}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentOptions = 
                          form.getValues(`questions.${index}.options`) || [];
                        form.setValue(`questions.${index}.options`, [
                          ...currentOptions,
                          { label: '', value: '' }
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button
        className='cursor-pointer'
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