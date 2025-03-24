// components/forms/form-filler.jsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '../ui/card';
import { Input } from '../ui/input';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage,
  FormDescription
} from '../ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Textarea } from '../ui/textarea';

// ==========================================
// Form Filler Component
// ==========================================
export default function FormFiller({ form, previewMode, className }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // Dynamic Validation Schema Generation
  // ==========================================
  const fieldSchemas = form.questions.reduce((acc, question) => {
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
        baseSchema = z.number().min(1).max(parseInt(question.scale) || 5).optional();
        break;
      default:
        baseSchema = z.string();
    }
    
    // Apply required validation if needed
    if (question.required) {
      if (question.type === 'CHECKBOX') {
        acc[`question_${question.id}`] = baseSchema.refine(val => val && val.length > 0, {
          message: `${question.label} is required`
        });
      } else if (question.type === 'DATE') {
        acc[`question_${question.id}`] = z.date({
          required_error: `${question.label} is required`,
        });
      } else {
        acc[`question_${question.id}`] = baseSchema.min(1, {
          message: `${question.label} is required`
        });
      }
    } else {
      acc[`question_${question.id}`] = baseSchema.optional();
    }
    
    return acc;
  }, {});

  const formSchema = z.object(fieldSchemas);

  // ==========================================
  // Form Setup and Default Values
  // ==========================================
  const formMethods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: form.questions.reduce((acc, question) => {
      switch (question.type) {
        case 'CHECKBOX':
          acc[`question_${question.id}`] = [];
          break;
        case 'RATING':
          acc[`question_${question.id}`] = 0;
          break;
        default:
          acc[`question_${question.id}`] = '';
      }
      return acc;
    }, {})
  });

  // ==========================================
  // Form Submission Handler
  // ==========================================
  const onSubmit = async (data) => {
    if (previewMode) return;
    
    setIsSubmitting(true);
    try {
      const answers = Object.entries(data).map(([key, value]) => ({
        questionId: key.replace('question_', ''),
        value: typeof value === 'object' && value instanceof Date 
          ? value.toISOString() 
          : Array.isArray(value) 
            ? JSON.stringify(value) 
            : value.toString()
      }));

      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: form.id,
          answers
        })
      });

      if (!response.ok) throw new Error('Failed to submit response');

      toast.success("Your response has been recorded!");
      router.push(`/forms/${form.id}/confirmation`);
    } catch (error) {
      toast.error(`Error: ${error.message || 'Failed to submit form'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Field Rendering Components
  // ==========================================
  const renderFieldByType = (question, field) => {    
    switch (question.type) {
      case 'TEXT':
        return (
          <FormControl>
            <Input
              {...field}
              placeholder={question.placeholder || ''}
              disabled={previewMode}
            />
          </FormControl>
        );
        
      case 'DROPDOWN':
        return (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={previewMode}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {question.options.map((option) => (
                <SelectItem 
                  key={option.id} 
                  value={option.value}
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
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    value={option.value}
                    checked={field.value?.includes(option.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        field.onChange([...field.value, option.value]);
                      } else {
                        field.onChange(
                          field.value.filter(value => value !== option.value)
                        );
                      }
                    }}
                    disabled={previewMode}
                  />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.label}</Label>
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
              className="space-y-2"
              disabled={previewMode}
            >
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value} 
                    id={`${question.id}-${option.id}`} 
                  />
                  <Label htmlFor={`${question.id}-${option.id}`}>{option.label}</Label>
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
                  className={`w-full justify-start text-left font-normal ${
                    !field.value && "text-muted-foreground"
                  }`}
                  disabled={previewMode}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP") : "Select a date"}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
                disabled={previewMode}
              />
            </PopoverContent>
          </Popover>
        );
        
      case 'FILE':
        return (
          <FormControl>
            <Input
              type="file"
              onChange={(e) => field.onChange(e.target.files[0])}
              disabled={previewMode}
            />
          </FormControl>
        );
        
      case 'RATING':
        const scale = parseInt(question.scale) || 5;
        return (
          <FormControl>
            <div className="flex items-center space-x-2">
              {[...Array(scale)].map((_, i) => (
                <Button
                  key={i}
                  type="button"
                  variant={field.value > i ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 rounded-full"
                  onClick={() => field.onChange(i + 1)}
                  disabled={previewMode}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </FormControl>
        );
      
      default:
        return (
          <FormControl>
            <Textarea
              {...field}
              placeholder={question.placeholder || ''}
              disabled={previewMode}
            />
          </FormControl>
        );
    }
  };

  // ==========================================
  // Main Render
  // ==========================================
  return (
    <Card className={`max-w-2xl mx-auto px-4 py-8  ${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-3xl">{form.title}</CardTitle>
        {form.description && (
          <p className="text-muted-foreground mt-2">{form.description}</p>
        )}
      </CardHeader>
      
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {form.questions.map((question) => (
              <FormField
                key={question.id}
                control={formMethods.control}
                name={`question_${question.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {question.label}
                      {question.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </FormLabel>
                    
                    {renderFieldByType(question, field)}
                    
                    {question.placeholder && question.type !== 'TEXT' && (
                      <FormDescription>
                        {question.placeholder}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>

          <CardFooter className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting || previewMode}
              className={isSubmitting ? "cursor-not-allowed" : 'cursor-pointer'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || previewMode}
              className={isSubmitting ? "cursor-not-allowed" : 'cursor-pointer'}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}